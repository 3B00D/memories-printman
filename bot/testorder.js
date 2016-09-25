var ordersModel = require('./orders.js');

clietId="Yasser1";
/*
var result = ordersModel.createOrder(clietId,function(err,data){
                if (err) {
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Item ....", JSON.stringify(data,null, 4));
                }
            });

var id="";
*/
var data = ordersModel.CheckClientOrders(clietId,function(err,data){
                if (err) {
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("GetItem succeeded ....", JSON.stringify(data,null, 4));
                }
            });
/*
var data = ordersModel.getItem(id,function(err,data){
                if (err) {
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("GetItem succeeded ....", JSON.stringify(data,null, 4));
                }
            });
/*
*/
/*
var data = ordersModel.getOrderStatus(id,function(err,data){
                if (err) {
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Missing ....", JSON.stringify(data,null, 4));
                }
            });
 */