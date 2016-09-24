var botBuilder = require('claudia-bot-builder');
var natural = require("natural");
var async = require('async');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var sqs = new AWS.SQS({region : 'us-east-1'});
var uplodSqsUrl = "https://sqs.us-east-1.amazonaws.com/957854044465/Printman-Uploader-Q";
function addImageToUploadSQS(obj,callback)
{
	var params = {
	    MessageBody: JSON.stringify(obj),
	    QueueUrl: uplodSqsUrl
	  };
	  sqs.sendMessage(params, callback);
}
function getURIFromString(str)
{
	var uri_pattern = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
	return str.match(uri_pattern);
}

function handleMessage(message,context)
{

	console.log('incoming message is ',message);
	var images = getURIFromString(message);
	if(images!=null)
	{
		async.forEachOf(images, function (value, key, callback) {
		  addImageToUploadSQS({ image : value }, function (err,res){
		  	console.log("sqs res ",err,res);
		  	callback(err,res);
		  });
		}, function (err) {
		  if (err)
		  {
		  	console.error(err.message);
		  	context.fail();
		  }
		  return analyzeText(message);
		  context.done();
		});
	}
	else
	{
		return analyzeText(message);
		context.done();
	}

	function analyzeText(message)
	{
		tokenizer = new natural.TreebankWordTokenizer();
		var tokens = tokenizer.tokenize(message);
		return JSON.stringify(tokens);
	}
}
/*
var res = getURIFromString("bro , print those please http://vignette2.wikia.nocookie.net/naruto/images/1/14/Orochimaru_Infobox.png/revision/latest?cb=20150925223113 http://virtuoso.openlinksw.com/dataspace/doc/dav/wiki/Main/VirtLinkedDataDeployment/conductor_url_rewrite_ui_1.png , https://i.ytimg.com/vi/sXEDfpDcb68/maxresdefault.jpg");
for(var i = 0 ;i<res.length;i++)
{
uploadFromURI(res[i],new Date().getTime()+".png","printman-images",function (){});

}*/
//console.log(handleMessage("please print this for me https://i.ytimg.com/vi/sXEDfpDcb68/maxresdefault.jpg"));
module.exports = botBuilder(function (message)
{
	return handleMessage(message.text);
});