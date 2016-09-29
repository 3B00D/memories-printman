var botBuilder = require('claudia-bot-builder');
var natural = require("natural");
var AWS = require('aws-sdk');
var async = require('async');
var sns = new AWS.SNS({region:'us-east-1'});
var slackresponder = require('./slack-responder');
var orders = require('./orders');
var configModel = require('./config.js');
var nlp = require('nlp_compromise');
var phoneNumberParser = require('./phone-number-parser');
var phoneParser = new phoneNumberParser();
var uploadOrderTopic = "arn:aws:sns:us-east-1:957854044465:image-upload-topic";
var printOrderTopic = "arn:aws:sns:us-east-1:957854044465:printman-process-order";
var slackDelayedReply = botBuilder.slackDelayedReply
var greetings = [
	{term:"Hey, Hey man, Hi , hello",answer:"Hey boss, I am so excited to help you printing your memories :D"},
	{term:"Good morning, Good afternoon, or Good evening",answer:"sir.",answerSame : true},
	{term:"what's up, Whats up?, Whats new?, or Whats going on?",answer:"Everything is ok, What about you?"}
];
var themes = [];
var themeTypes = {};
var commands = [
		{ 
			'command':'start' , 
			'keywords':['start','print','apply','run','go','execute','initialize','render'] , 
			'message' : 'Printing your image.' ,
			'run' : function(order , callback)
			{
				// trigger sns to start producing the pdf (you can also return back an error message using the slack command).
				var params = {
			        Message: JSON.stringify({ order : order }, null, 2), 
			        Subject: "printing order",
			        TopicArn: printOrderTopic
			    };
			    sns.publish(params,function (err,d)
		    	{
		    		callback(err,d);
		    	});
			}
		}
	];
function getURIFromString(str)
{
	var uri_pattern = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
	return str.match(uri_pattern);
}

function handleImages(event,order,callback)
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
		        Message: JSON.stringify({ image : value , respondUrl : respondUrl , sender : sender , order : order }, null, 2), 
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
		callback(null);
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
		var images = [];
		for(var i = 0;i<themeTypes[order.theme].length;i++)
		{
			images.push({
	    		"image_url" : themeTypes[order.theme][i].image,
	    		"fallback" : themeTypes[order.theme][i].name
	    	});
		}
		return {text : "What is the required theme type? options are : " , attachments : images };
	}
	if( order.completed == 0 )
	{
		var orderInfo = "First Name : "+order.firstName;
		orderInfo+= "\nLastName : "+order.lastName;
		orderInfo+= "\nAddress : "+order.address;
		orderInfo+= "\nPhone Number : "+order.phoneNumber;
		orderInfo+= "\nTheme : "+order.theme;
		orderInfo+= "\nTheme type : "+order.themeType;
		return "You are ready to go... your order info is : \n"+ orderInfo +"\nDo you wish to start ?";
	}

}

function decideOrderResponse ( order , message , callback ) 
{
	if(order.theme == '#' || order.themeType == '#')
	{
		var result = configModel.getThemes(function(err,data){
            if (err) {
                console.error("Unable to read config.",err);
            } else {
            	themes = Object.keys(data);
            	themeTypes = data;
                processAndReply();
            }
        });
	}
	else
	{
		processAndReply();
	}

	function processAndReply()
	{
		var analysed = nlp.text(message);
		var people = analysed.people();
		var firstname = null;
		var lastname = null;
		var address = null;
		var phone = null;
		var theme = null;
		var themeType = null;
		if(people.length > 0 )
		{
			for(var i = 0 ; i< people.length ; i++)
			{
				// console.log(people[i]);
				if( people[i].firstName && order.firstName == '#' )
				{
					firstname = people[i].firstName;
				}
				if( people[i].lastName && order.lastName == '#' )
				{
					lastname = people[i].lastName;
				}
			}
		}

		var places = analysed.places();
		if( order.address == '#' && places.length > 0)
		{
			address = message;
		}
		else if(order.phoneNumber == '#')
		{
			phoneParser.parse(message);
			if(phoneParser.items.length>0)
			{
				phone = phoneParser.items.join(',');
			}
		}

		if(order.theme == '#')
		{
			for(var i = 0; i<themes.length;i++)
			{
				if(message.toLowerCase().indexOf(themes[i].toLowerCase())>= 0 )
				{
					theme = themes[i];
				}
			}
		}
		
		if(order.themeType == '#')
		{
			if(order.theme != '#')
			{
				for(var i =0 ; i<themeTypes[order.theme].length;i++)
				{
					if(themeTypes[order.theme][i].name.toLowerCase() == message.toLowerCase())
					{
						themeType = themeTypes[order.theme][i].name;
						break;
					}
				}
			}
		}

		// fill whatever i find
		if(firstname)
		{
			order.firstName =  firstname;
			order.requireUpdate = true;
		}
		if(lastname)
		{
			order.lastName =  lastname;
			order.requireUpdate = true;
		}
		if(address)
		{
			order.address =  address;
			order.requireUpdate = true;
		}
		if(phone)
		{
			order.phoneNumber =  phone;
			order.requireUpdate = true;
		}
		if(theme)
		{
			order.theme=theme;
			order.requireUpdate = true;
		}

		if(themeType)
		{
			order.themeType=themeType;
			order.requireUpdate = true;
		}

		var responseded = false;
		if(!order.requireUpdate)
		{
			var command = null;
			var terms = nlp.sentence(message).terms;
			for(var i = 0; i<terms.length;i++)
			{
				//console.log(terms[i]);
				if(terms[i].pos.Verb == true)
				{
					// check to se if it is a command.
					for (var j = 0; j < commands.length ; j++) 
					{
						if(commands[j].keywords.indexOf(terms[i].normal) >= 0)
						{
							command = commands[j];
							responseded = true;
							orders.UpdateOrder(order.Id,order,function (err,data)
							{
								if(err)
								{
									callback(err);
								}
								else
								{
									command.run(order,function (err,d)
									{
										callback( err,command.message );
									});
								}
							});
						}
					}
				}
			}
		}
		if(!responseded)
		{
			if(order.firstName == '#' && order.lastName=='#' && order.address == '#' && order.phoneNumber == '#' && order.theme == '#' && order.themeType == '#')
			{
				var tfidf = new natural.TfIdf();
				var maxMeasured = 0;
				var greeting = null;
				for(var i = 0 ; i< greetings.length;i++)
				{
					tfidf.addDocument(greetings[i].term);
					if(tfidf.tfidf(message, i) > maxMeasured)
					{
						greeting = greetings[i];
					}
				}
				var messageResponse = "";
				if(greeting != null)
				{
					messageResponse= (greeting.answerSame?message + " " :"")+greeting.answer;
				}
				else
				{
					messageResponse = "Sorry sir, i couldn't understand your command.";
				}
				callback(null,messageResponse);
			}
			else
			{
				var nextResponse = getNextQuestion(order);
				if(order.requireUpdate)
				{
					orders.UpdateOrder(order.Id,order,function (err,data)
					{
						console.log(err);
						callback(err,nextResponse);
					});
				}
				else
				{
					callback(null,nextResponse);
				}
			}
			
		}
	}
	
}

function handleOrderMessage( event , callback , manuallyRespond)
{
	var message = event.text;
	var response_url = event.originalRequest.response_url;
	var sender = event.sender;
	// completed : 0 -> not completed , 1 -> completed , 2 -> in progress
	orders.CheckClientOrders(sender,function (err, data)
		{
			//console.log('check client orders ',err,data);
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
							console.log('create order', err , data);
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
										callback(response,data);
									}
								});
							}
						});
				}
				else
				{
					if(old.attributes.response_url!=response_url)
					{
						old.requireUpdate = true;
						old.attributes.response_url = response_url;
					}
					decideOrderResponse( old , message , function (err,response)
						{
							if(err)
							{
								callback('An error occured while processing your command.');
							}
							else
							{
								callback(response,old);
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
		handleOrderMessage(message,function (response,order)
      		{
      			console.log('promise handleOrderMessage response',response,order);
      			resolve({response : response,order:order});
      		});
    })
      .then((response) => {
      	var order = response.order;
      	var response = response.response;
      	return new Promise((resolve, reject) => {
      		console.log('trying to handle the order images.',order);
      		if(order)
      		{
      			handleImages(message,order,function (err)
		      	{
		      		console.log('handle images response',err);
		      		if (err) return reject(err);

			        resolve(response);
		      	});
      		}
      		else
      		{
      			reject(response);
      		}
      	}).then((response)=>
      	{
      		var result = {};
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
      	.catch((err) => {
      		console.log(err);
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

// console.log(handleOrderMessage({ sender : 'U2C4HC9DCB', originalRequest:{ response_url : "https://hooks.slack.com/commands/T2C4H2X3K/84593953089/hXTgd5vmcqLEIIJdap4XtUeR" }, text : "Good day"},function (res){console.log(res);}));