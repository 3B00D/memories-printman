var AWS = require("aws-sdk");
var shortid = require('shortid');

AWS.config.update({
  region: "us-east-1",
});

var dynamoClient = new AWS.DynamoDB.DocumentClient();

TABLENAME = "OrderImages";

module.exports = {

    addOrderImage :function (orderId,userId,imageUrl,callback){
        var data1={"TableName": TABLENAME,
            Item: {
                "OrderId": orderId,
                "imageUrl": imageUrl,
                "userId": userId
            }
        };

        var result=createRow(data1,function(err,data)
            {
                //console.log(data);
                callback(err,data1.Item);
            }
        );
    },
    getOrderImages :function (orderId,callback){
        readRows(orderId, function(err,data) {
                 callback(err,data);
        });
    },
};

    function createRow(data1,callback){
        //console.log("connecting to Dynamo");
        var r;
        dynamoClient.put( data1,
            function(err,result) {
                if (err) {
                    console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    callback(err,result);
                }
        });
        
    }

    function readRows(id,callback){
        //console.log("connecting to Dynamo");
        var params = {
            TableName: TABLENAME,
            Key:{
                 "OrderId": id
            }
        };
        
        dynamoClient.scan(params, function(err, data) {
            if (err) {
                console.error("Unable to read item");
                callback(err, data);
            } else {
                callback(err, data);
            }
        });
        
    }
    function updateRow(data,callback){
        //console.log("connecting to Dynamo");
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
    function readSecandory(Id,indexName,column,callback){
        console.log("connecting to Dynamo");
                
        var params = {
            TableName: TABLENAME,
            IndexName: indexName,
            ConsistentRead : false,
            KeyConditionExpression: column+" = :x",
            ExpressionAttributeValues: {
                ":x": Id
            },
            ProjectionExpression: "Id,userId,firstName,lastName,address,phoneNumber,theme,themetype,paperType,completed,attributes,postcode"
        };
        console.error("Params:", JSON.stringify(params, null, 3));
        dynamoClient.query(params, function(err, data) {
            if (err) {
                console.error("Unable to read item");
                callback(err, data);
            } else {
                callback(err, data);
            }
        });
        
    }