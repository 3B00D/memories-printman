var request = require('request');
module.exports = 
{
	respond : function ( url , message , callback )
	{
		request.post(url , message , function (err, res,body)
			{
				callback(err, res , body);
			});
	}
};