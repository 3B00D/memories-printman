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
                        
                        var dataJson = JSON.parse(data);
                        result= Object.keys(dataJson);
                        callback(err,result);
                    }
                );
    },
    getThemeTypes:function(theme,callback){
        var result=getConfig("Themes",function(err,data)
                    {
                        
                        var dataJson = JSON.parse(data);
                        var hasOwn = Object.prototype.hasOwnProperty;
                        if (hasOwn.call(dataJson, theme)) {
                           console.log("Exist");
                           callback(err,dataJson[theme]);
                        }
                        else
                        {
                            console.log("Error no Theme "+theme);
                        }
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
        // console.log("Querying the config :"+config);
    var params = {
        TableName : TABLENAME,
        KeyConditionExpression: " #conf = :x ",
        
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
        result = {};
        for (var key in data.Items) {
            if (data.Items[key].Name=config) {
                result = data.Items[key].Value;
            }
        }          
        callback(err,result);
    });
}


