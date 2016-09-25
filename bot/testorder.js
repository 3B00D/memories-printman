var ordersModel = require('./orders.js');
//var result = ordersModel.createOrder();

var id="B1MmgWN6";
/*
var data = ordersModel.getItem(id,function(err,data){
                if (err) {
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("GetItem succeeded ....", JSON.stringify(data,null, 4));
                }
            });
*/
var data = ordersModel.getOrderStatus(id,function(err,data){
                if (err) {
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("GetItem succeeded ....", JSON.stringify(data,null, 4));
                }
            });
 