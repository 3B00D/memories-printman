var AWS = require("aws-sdk");


AWS.config.update({
  region: "us-east-1",
});

var dynamoClient = new AWS.DynamoDB.DocumentClient();

TABLENAME = "Config";


module.exports = {
    getThemes:function(callback){
        var result=getConfig("Themes",function(err,data)
                    {
                        callback(err,data);
                    }
                );
    }
}

    function getPaperTypes(){
        var result = getConfig("PaperTypes" ,function(err,data)
                     {
                        console.log("Result is :"+JSON.stringify(data));       
                     }
                     );
    }

    function getConfig(config,callback){
        console.log("Querying the config :"+config);
    var params = {
        TableName : TABLENAME,
        KeyConditionExpression: "#conf = :x",
        
        ExpressionAttributeNames:{
            "#conf": "Name"
        },
        ExpressionAttributeValues: {
            ":x":config
        }
    };
    var result;
    dynamoClient.query(params, function(err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
        } else {
            //console.log("Query succeeded.");
        }
        // Only themes there for now 
        callback(err,data.Items[0].Value);
    });
}


