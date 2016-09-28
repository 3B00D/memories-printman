exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    callback(null, {
        statusCode: '200',
        body: event.body,
        headers: {
            'Content-Type': 'application/json',
        },
    });
};