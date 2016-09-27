var ordersImagesModel = require('./orderImages.js');

orderId="1";
userId="1";
imageUrl="2.";
/*
var result = ordersImagesModel.addOrderImage(orderId,userId,imageUrl,function(err,data){
                if (err) {
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Item ....", JSON.stringify(data,null, 4));
                }
            });

*/
var result = ordersImagesModel.getOrderImages(orderId,function(err,data){
                if (err) {
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Item ....", JSON.stringify(data,null, 4));
                }
            });
