var botBuilder = require('claudia-bot-builder');
var speakeasy = require("speakeasy-nlp");
var request = require('request');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
function uploadFromURI(uri, filename , bucket_name , callback )
{
	var options = {
        uri: uri,
        encoding: null
    };
    request(options, function(error, response, body) {
        if (error || response.statusCode !== 200) { 
            console.log("failed to get image");
            console.log(error);
            callback(error,response,body);
        } else {
            s3.putObject({
                Body: body,
                Key: filename,
                Bucket: bucket_name
            }, function(error, data) {
                if (error) {
                    console.log("error downloading image to s3");
                } else {
                    console.log("success uploading to s3");
                }
                callback(error,data);
            }); 
        }
    });
}

function getURIFromString(str)
{
	var uri_pattern = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
	return str.match(uri_pattern);
}

function handleMessage(message)
{
	console.log('incoming message is ',message.text);
	console.log('full request is',JSON.stringify(message.originalRequest));
	var analyzeResult = speakeasy.sentiment.analyze(message.text);   //=> { score: -1, ..... }

	// Classifying statements
	var meaningResult = speakeasy.classify(message.text);
	return 'analyzeresult is : '+JSON.stringify(analyzeResult)+'\n'+'meaningResult is : '+JSON.stringify(meaningResult);
}

//uploadFromURI("http://vignette2.wikia.nocookie.net/naruto/images/1/14/Orochimaru_Infobox.png/revision/latest?cb=20150925223113","orochimaru.png","printman-images",function (){});
module.exports = botBuilder(function (message)
{
	return handleMessage(message);
});