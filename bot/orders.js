var AWS = require("aws-sdk");
var shortid = require('shortid');

AWS.config.update({
  region: "us-east-1",
});

var dynamoClient = new AWS.DynamoDB.DocumentClient();

TABLENAME = "Orders";

module.exports = {

    createOrder :function (userId,attributes,callback){
        id=shortid.generate()+"";
        //console.log(id);
        var data1={"TableName": TABLENAME,
            Item: {
                "Id": id,
                "userId": userId,
                "firstName": "#",
                "lastName":"#",
                "address": "#",
                "phoneNumber": "#",
                "theme": "#",
                "themeType": "#",
                "completed": 0,
                "attributes": attributes,
            }
        };

        var result=createRow(data1,function(err,data)
            {
                //console.log(data);
                callback(err,data1.Item);
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
                    if(data[key][key2]=="#")
                    {
                        emptyAttr.push(key2);
                    }
                }
                
              }
            }
            callback(err,emptyAttr);
        });
        
    },
    UpdateOrder :function (orderId,data,callback){
        updateRow(orderId,data, function(err,data) {
            callback(err,data);
        });
    },
    CheckClientOrders :function (clientId,callback){
        readSecandory(clientId,"userId-index-2","userId",function(err,data) {
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

    function readRow(id,callback){
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
    
    function updateRow(orderId,data,callback){
        //console.log("connecting to Dynamo");
        var params = {
        TableName: TABLENAME,
        Key: {
                "Id":orderId
        },
            UpdateExpression: "SET firstName = :firstName , lastName = :lastName , address = :address , userId = :userId , theme = :theme , themeType = :themeType , phoneNumber = :phoneNumber , completed = :completed , attributes = :attributes",
            ExpressionAttributeValues: {
                ":firstName": data.firstName,
                ":lastName": data.lastName,
                ":address": data.address,
                ":userId": data.userId,
                ":theme": data.theme,
                ":themeType": data.themeType,
                ":phoneNumber": data.phoneNumber,
                ":completed": data.completed,
                ":attributes": data.attributes,
            },
            ReturnValues: "ALL_NEW"
        };

        dynamoClient.update(params, function(err, data) {
            callback(err, data);
        });

    }
    function readSecandory(Id,indexName,column,callback){
        //console.log("connecting to Dynamo");
                
        var params = {
            TableName: TABLENAME,
            IndexName: indexName,
            ConsistentRead : false,
            KeyConditionExpression: column+" = :x",
            ExpressionAttributeValues: {
                ":x": Id
            },
            ProjectionExpression: "Id,userId,firstName,lastName,address,phoneNumber,theme,themeType,completed,attributes"
        };
        //console.error("Params:", JSON.stringify(params, null, 3));
        dynamoClient.query(params, function(err, data) {
            if (err) {
                console.error("Unable to read item");
                callback(err, data);
            } else {
                callback(err, data);
            }
        });
        
    }