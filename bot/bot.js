var botBuilder = require('claudia-bot-builder');
var natural = require("natural");
var AWS = require('aws-sdk');
var async = require('async');
var sns = new AWS.SNS({region:'us-east-1'});
var slackresponder = require('./slack-responder');
var uploadOrderTopic = "arn:aws:sns:us-east-1:957854044465:image-upload-topic";
var slackDelayedReply = botBuilder.slackDelayedReply;
function getURIFromString(str)
{
	var uri_pattern = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
	return str.match(uri_pattern);
}

function handleMessage(event,callback)
{
	var message = event.text;
	var respondUrl = event.originalRequest.response_url;
	console.log('incoming event is ',event);
	var images = getURIFromString(message);
	if(images!=null)
	{
		async.forEachOf(images, function (value, key, acallback) {
		  var params = {
		        Message: JSON.stringify({ image : value , respondUrl : respondUrl }, null, 2), 
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
		return analyzeText(message);
	}
	
	
}

function analyzeText(message , manuallyRespond)
{
	tokenizer = new natural.TreebankWordTokenizer();
	var tokens = tokenizer.tokenize(message);
	if(manuallyRespond)
	{
		respond(respondUrl,JSON.stringify(tokens),function ()
			{
			});
	}
	else
	{
		return JSON.stringify(tokens);
	}
}
/*
var res = getURIFromString("bro , print those please http://vignette2.wikia.nocookie.net/naruto/images/1/14/Orochimaru_Infobox.png/revision/latest?cb=20150925223113 http://virtuoso.openlinksw.com/dataspace/doc/dav/wiki/Main/VirtLinkedDataDeployment/conductor_url_rewrite_ui_1.png , https://i.ytimg.com/vi/sXEDfpDcb68/maxresdefault.jpg");
for(var i = 0 ;i<res.length;i++)
{
uploadFromURI(res[i],new Date().getTime()+".png","printman-images",function (){});

}*/
//console.log(handleMessage({ originalRequest:{ response_url : "https://hooks.slack.com/commands/T2C4H2X3K/83601128182/D1ApAztUPfJvHUcpml2ZC93A" }, text : "please print this for me https://i.ytimg.com/vi/sXEDfpDcb68/maxresdefault.jpg"},function (){}));
var api = botBuilder(function (message,apiRequest)
{

	return new Promise((resolve, reject) => {
      handleMessage(message,function (err)
      	{
      		if (err) return reject(err);

	        resolve();
      	});
    })
      .then(() => {
        return { // the initial response
          text: analyzeText(message.text),
          response_type: 'in_channel'
        }
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