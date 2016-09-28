var AWS = require('aws-sdk');
var request = require('request');
var slackresponder = require('./slack-responder');
var ordersImagesModel = require('./orderImages.js');

var s3 = new AWS.S3();
var bucket_name = "printman-images";
exports.handler = (event, context, callback) => {
	console.log('received event is : ',JSON.stringify(event));
	var ev = JSON.parse(event.Records[0].Sns.Message);
    var uri = ev.image;
    var respondUrl = ev.respondUrl;
    var sender = ev.sender;
    var order = ev.order;
	var options = {
	        uri: uri,
	        encoding: null
	    };
    request(options, function(error, response, body) {
        if (error || response.statusCode !== 200) {
        	respond(respondUrl,"I couldn't save this image `"+uri+"` to my assets list.\n Reason : "+error,function ( err , response , body )
        		{
        			console.log('slack responder response',err,body);
        			context.fail();
        		});
            
        } else {
            var imgurl = sender + "/" + Math.random().toString(36)+".png";
            s3.putObject({
                Body: body,
                Key: imgurl,
                Bucket: bucket_name
            }, function(error, data) {
                if (error) {
                	console.log("error uploading image to s3");
                	respond(respondUrl,"I couldn't save this image `"+uri+"` to my assets list.\n Reason : "+error,function ( err , response , body )
	        		{
	        			console.log('slack responder response',err,body);
	        			context.fail();
	        		});
                } else {
                    console.log("success uploading to s3");
                    var result = ordersImagesModel.addOrderImage(order.Id,sender,imgurl,function(err,data){
                        if (err) {
                            console.error("Unable to add image item. Error JSON:", JSON.stringify(err, null, 2));
                            respond(respondUrl,"Unable to add image to the order items.\n"+JSON.stringify(err, null, 2),function ( err , response , body )
                            {
                                console.log('slack responder response',err,body);
                                context.done();
                            });
                        } else {
                            respond(respondUrl,"This image `"+uri+"` has been uploaded to s3 and saved to your order images.",function ( err , response , body )
                            {
                                console.log('slack responder response',err,body);
                                context.done();
                            });
                        }
                    });
                    
                }
            }); 
        }
    });
};

function respond(uri , text , callback)
{
	slackresponder.respond(uri,{json:{ text : text }}, callback);
}