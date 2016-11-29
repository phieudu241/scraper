// Test get API
var http = require("http");
app.get('/diply', function (req, res) {
    var options = {
        host: 'service-search.diply.com',
        port: 80,
        path: '/api/v2/feed/category/14/next?pageSize=100&next=&locale=en',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    getJSON(options,
        function(statusCode, result)
        {
            // I could work with the result html/json here.  I could also just return it
            console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
            res.statusCode = statusCode;
            res.send(result);
        });
});

function getJSON(options, onResult)
{
    console.log("rest::getJSON");

    var prot = options.port == 443 ? https : http;
    var req = prot.request(options, function(res)
    {
        var output = '';
        console.log(options.host + ':' + res.statusCode);
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function() {
            var obj = output ? JSON.parse(output) : output;
            onResult(res.statusCode, obj);
        });
    });

    req.on('error', function(err) {
        res.send('error: ' + err.message);
    });

    req.end();
};