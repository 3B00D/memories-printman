var botBuilder = require('claudia-bot-builder');
var natural = require("natural");
var AWS = require('aws-sdk');
var async = require('async');
var sns = new AWS.SNS({region:'us-east-1'});
var slackresponder = require('./slack-responder');
var orders = require('./orders');
var nlp = require('nlp_compromise');
var phoneNumberParser = require('./phone-number-parser');
var phoneParser = new phoneNumberParser();
var uploadOrderTopic = "arn:aws:sns:us-east-1:957854044465:image-upload-topic";
var slackDelayedReply = botBuilder.slackDelayedReply

var themes = ['kids','adults'];
var themeTypes = {'kids':['1','2','3'] , 'adults' : ['1',3]};
function getURIFromString(str)
{
	var uri_pattern = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
	return str.match(uri_pattern);
}

function handleImages(event,callback)
{
	var message = event.text;
	var respondUrl = event.originalRequest.response_url;
	var sender = event.sender;
	console.log('incoming event is ',event);
	var images = getURIFromString(message);
	if(images!=null)
	{
		async.forEachOf(images, function (value, key, acallback) {
		  var params = {
		        Message: JSON.stringify({ image : value , respondUrl : respondUrl , sender : sender  }, null, 2), 
		        Subject: "upload order",
		        TopicArn: uploadOrderTopic
		    };
		    sns.publish(params,function (err,d)
	    	{
	    		acallback(err,d);
	    	});
		}, function (err) {
		  callback(err);
		});
	}
	else
	{
		callback();
	}
}

function getNextQuestion(order)
{
	if(order.firstName=='#')
	{
		return "What is your name?";
	}
	if(order.lastName=='#')
	{
		return "What is your last name?";
	}
	if(order.address== '#')
	{
		return "What is your address?";
	}
	if(order.phoneNumber =='#')
	{
		return "What is your phone number?";
	}
	if(order.theme == '#')
	{
		return {text : "What is the required theme? options are : "+themes.join(' , ') };
	}
	if(order.themeType == '#')
	{
		return "What is the required theme type? options are : "+themeTypes[order.theme].join(' , ');
	}
	if( order.completed == 0 )
	{
		return "You are ready to go... your order info is : \n"+ JSON.stringify(order, null, 2) +"\nstart ?";
	}

}

function decideOrderResponse ( order , message , callback ) 
{
	var analysed = nlp.text(message);
	var people = analysed.people();
	var firstname = null;
	var lastname = null;
	var address = null;
	var phone = null;
	var theme = null;
	var themeType = null;
	if( ( order.firstName == '#' || order.lastName == '#' ) && people.length > 0 )
	{
		for(var i = 0 ; i< people.length ; i++)
		{
			if(people[i].firstName)
			{
				firstname = people[i].firstName;
			}
			if(people[i].lastName)
			{
				lastname = people[i].lastName;
			}
		}
	}

	var places = analysed.places();
	if( order.address == '#' && places.length > 0)
	{
		address = "";
		for (var i = 0; i < places.length ; i++ ) {
			address+= places[i].text + " ";
		};
	}
	else if(order.phoneNumber == '#')
	{
		phoneParser.parse(message);
		console.log(phoneParser);
		if(phoneParser.items.length>0)
		{
			phone = phoneParser.items.join(',');
		}
	}

	if(order.theme == '#')
	{
		for(var i = 0; i<themes.length;i++)
		{
			if(message.indexOf(themes[i])>= 0 )
			{
				theme = themes[i];
			}
		}
	}
	
	if(order.themeType == '#')
	{
		if(order.theme != '#' && themeTypes[order.theme].indexOf(message)>=0)
		{
			themeType = message;
		}
	}

	// fill whatever i find
	if(firstname)
	{
		order.firstName =  firstname;
	}
	if(lastname)
	{
		order.lastName =  lastname;
	}
	if(address)
	{
		order.address =  address;
	}
	if(phone)
	{
		order.phoneNumber =  phone;
	}
	if(theme)
	{
		order.theme=theme;
	}

	if(themeType)
	{
		order.themeType=themeType;
	}

	var terms = nlp.sentence(message).terms;
	for(var i = 0; i<terms.length;i++)
	{
		if(terms[i].pos.Verb == true)
		{
			// console.log(terms[i].Verb);
			// check to se if it is a command.
		}
	}
	// TODO : check if it is a theme type 


	// TODO : set (start,print,go) commands to affect completed variable.


	var nextQuestion = getNextQuestion(order);
	
	console.log(nextQuestion,order);

	// console.log('should respond to user : ',nextQuestion,order,message , callback);
	callback(null,"Respones : "+message);
}

function handleOrderMessage( event , callback , manuallyRespond)
{
	var message = event.text;
	var response_url = event.originalRequest.response_url;
	var sender = event.sender;
	// completed : 0 -> not completed , 1 -> completed , 2 -> in progress
	orders.CheckClientOrders(sender,function (err, data)
		{
			console.log('check client orders ',err,data);
			if(err)
			{
				callback('An error occured while trying to get your order.\n'+err);
			}
			else
			{
				var old = null;
				for(var i =0 ; i< data.Items.length ; i++)
				{
					if( data.Items[i].completed == 2 )
					{
						return callback("Your orders is being processed, please wait...");
					}
					if( data.Items[i].completed == 0 )
					{
						old = data.Items[i];
						break;
					}
				}

				if(old == null)
				{
					orders.createOrder(sender,{response_url : response_url},function (err, data)
						{
							console.log('create ordedr', err , data);
							if(err)
							{
								callback('An error occured while creating your order.\n'+err);
							}
							else
							{
								decideOrderResponse( data , message , function (err,response)
								{
									if(err)
									{
										callback('An error occured while processing your command.\n'+err);
									}
									else
									{
										callback(response);
									}
								});
							}
						});
				}
				else
				{
					decideOrderResponse( old , message , function (err,response)
						{
							if(err)
							{
								callback('An error occured while processing your command.');
							}
							else
							{
								callback(response);
							}
						});
				}
				// check order required info.
			}
		});
	/*tokenizer = new natural.TreebankWordTokenizer();
	var tokens = tokenizer.tokenize(message);
	if(manuallyRespond)
	{
		respond(respondUrl,JSON.stringify(tokens),function ()
			{
			});
	}
	else
	{
		callback(JSON.stringify(tokens));
	}*/
}
/*
var res = getURIFromString("bro , print those please http://vignette2.wikia.nocookie.net/naruto/images/1/14/Orochimaru_Infobox.png/revision/latest?cb=20150925223113 http://virtuoso.openlinksw.com/dataspace/doc/dav/wiki/Main/VirtLinkedDataDeployment/conductor_url_rewrite_ui_1.png , https://i.ytimg.com/vi/sXEDfpDcb68/maxresdefault.jpg");
for(var i = 0 ;i<res.length;i++)
{
uploadFromURI(res[i],new Date().getTime()+".png","printman-images",function (){});

}*/
//console.log(handleImages({ originalRequest:{ response_url : "https://hooks.slack.com/commands/T2C4H2X3K/83601128182/D1ApAztUPfJvHUcpml2ZC93A" }, text : "please print this for me https://i.ytimg.com/vi/sXEDfpDcb68/maxresdefault.jpg"},function (){}));
var api = botBuilder(function (message,apiRequest)
{

	return new Promise((resolve, reject) => {
      handleImages(message,function (err)
      	{
      		if (err) return reject(err);

	        resolve();
      	});
    })
      .then(() => {
      	return new Promise((resolve, reject) => {
      		handleOrderMessage(message,function (response)
      		{
      			resolve(response);
      		});
      	}).then((response)=>
      	{
      		if(typeof(response) == 'object')
      		{
      			result = response;
      		}
      		else
      		{
      			result.text = response;
      		}
      		result.response_type = 'in_channel';
      		return result;
      	})
      	.catch(() => {
	        return `Could not process your order`
	      });
      })
      .catch(() => {
        return `Could not process your order`
      });
});

function respond(uri , text , callback)
{
	slackresponder.respond(uri,{json:{ text : text }}, callback);
}

module.exports = api;
/*slackResponder.respond("https://hooks.slack.com/commands/T2C4H2X3K/83505579203/mXZrIbeSPcIMYUewwgwI0zqK",{json:{ text : "test" }}, function ( err , response , body )
	{
		console.log(err,body);
	});*/