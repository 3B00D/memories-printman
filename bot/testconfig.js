var configModel = require('./config.js');

var result = configModel.getThemes(function(err,data){
                if (err) {
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("", JSON.stringify(data,null, 4));
                }
            });

/*
Theme="kids";
var result = configModel.getThemesType(Theme,function(err,data){
                if (err) {
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("", JSON.stringify(data,null, 4));
                }
            });

*/
