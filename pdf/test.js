var fs = require('fs');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var bucket_name = "printman-images";
function test()
{
	var options = { format: 'Letter' , orientation : "portrait"};
	html="";
	var key = '1.html';
	fs.readFile('1.html', 'utf8', function (err,data) {
	  if (err) {
	    return console.log(err);
	  }
	  
	  var imagepath = "https://d1to9yjin79kmw.cloudfront.net/themes/kids/kids1/2.jpg";
	  var data = data.replace(new RegExp("##img1##", 'g'), imagepath,'g');
	  html=data;
	  console.log(html);
	  var params = {Bucket: bucket_name, Key: key, Body: html ,ContentType : 'text/html' };
		  s3.upload(params, function(err, data) {
		    console.log(err, data);
		  });

	});
}




test();
exports.handler = test;