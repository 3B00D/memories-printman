var AWS = require("aws-sdk");
var shortid = require('shortid');

AWS.config.update({
  region: "us-east-1",
});

var dynamoClient = new AWS.DynamoDB.DocumentClient();

TABLENAME = "Orders";

module.exports = {

	createOrder :function (){
        id=shortid.generate()+"";
        console.log(id);
        var data1={"TableName": TABLENAME,
            Item: {
                "Id": id,
                "firstName": " ",
                "lastName":" ",
                "address": " ",
                "phoneNumber": " ",
                "theme": " ",
                "themetype": " ",
                "paperType": " ",
                "completed": 0,
                "postcode": " "
            }
        };

		var result=createRow(data1,function(err,data)
            {
                console.log(data);
            }
        );
	},
    getItem :function (id,callback){            
            readRow(id, function(err,data) {
                 callback(err,data);
        });
    },
    getOrderStatus :function (id,callback){
        readRow(id, function(err,data) {
            emptyAttr=[];
            for (var key in data) {
              if (data.hasOwnProperty(key)) {
                for (var key2 in data[key]) {
                    //console.log(key2 + " -> " + data[key][key2]);
                    if(data[key][key2]==" ")
                    {
                        emptyAttr.push(key2);
                    }
                }
                
              }
            }
            callback(err,emptyAttr);
        });
        
    },
};
    
    function createRow(data1,callback){
       
        console.log("connecting to Dynamo");
        var r;
        
        dynamoClient.put( data1,
            function(err,result) {
                if (err) {
                    console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Added item:", JSON.stringify(result, null, 2));
                    
                    callback(err,result);
                }
        });
        
    }

    function readRow(id,callback){
        console.log("connecting to Dynamo");
        var params = {
            TableName: TABLENAME,
            Key:{
                 "Id": id
            }
        };
        
        dynamoClient.get(params, function(err, data) {
            if (err) {
                console.error("Unable to read item");
                callback(err, data);
            } else {
                callback(err, data);
            }
        });
        
    }
