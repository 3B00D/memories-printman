var fs = require('fs');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var bucket_name = "printman-orders";
var ordersImagesModel = require('./orderImages.js');
var ordersModel = require('./orders.js');
var s3url="https://s3.amazonaws.com/printman-images/";
var slackresponder = require('./slack-responder');

function respond(uri , text , callback)
{
	slackresponder.respond(uri,{json:{ text : text }}, callback);
}

function test(order,context)
{
	var orderId=order.Id;
	var respondUrl = order.attributes.response_url;
	//var orderId = message;//"ryOewXKa";
	var result = ordersImagesModel.getOrderImages(orderId,function(err,images){
		if (err) {
			console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
		} else {
			var allimages=images.Items;
			console.log(allimages);
			var options = { format: 'Letter' , orientation : "portrait"};
			html="";
			var key = orderId+'.html';
			fs.readFile(order.themeType+'.html', 'utf8', function (err,data) {
			if (err) {
				return console.log(err);
			}
			  
			
			for(var i = 0; i < allimages.length ; i++) {
				//var imagepath = "https://d1to9yjin79kmw.cloudfront.net/themes/kids/kids1/2.jpg";
				var imagepath = s3url + allimages[i].imageUrl;
				console.log(imagepath);
				var data = data.replace(new RegExp("##img"+(i+1)+"##", 'g'), imagepath,'g');
			}
			
			html=data;
			//console.log(html);
			var params = {Bucket: bucket_name, Key: key, Body: html ,ContentType : 'text/html' };
				  s3.upload(params, function(err, data) {
					//console.log(err, data);
					console.log("uploaded");
					url = data.Location;
					message = "Your book is uploaded "+url;
					order.completed = 1;
					ordersModel.UpdateOrder(order.Id,order,function (err,data)
					{
						if(err)
						{
							respond(respondUrl,err,function ( err , response , body )
                            {
                                context.fail();
                            });
						}
						else
						{
							respond(respondUrl,message,function ( err , response , body )
                            {
                                console.log('Yourbook is uploaded',err,data);
                                context.done();
                            });
						}
					});
				});

			});
		}
	}
)
;
}
console.log('Loading function');
 
exports.handler = function(event, context, callback) {
// console.log('Received event:', JSON.stringify(event, null, 4));
 	
    var message = event.Records[0].Sns.Message;
    //var message = "{\"order\":{\"phoneNumber\":\"01111692526\",\"address\":\"Malaysia, Kuala lumpur Damansara 60000\",\"lastName\":\"Mog\",\"completed\":0,\"theme\":\"kids\",\"Id\":\"ryOewXKa\",\"userId\":\"U2C4HC9DM\",\"attributes\":{},\"themeType\":\"Kids 1\",\"firstName\":\"John\"}}";
    console.log('Message received from SNS:', message); 
    
	var ev = JSON.parse(message);
	var order = ev.order;
	console.log(JSON.stringify(order));
	orderId=order.Id;
	console.log(JSON.stringify(orderId));
	test(order,context);
};

//exports.handler();