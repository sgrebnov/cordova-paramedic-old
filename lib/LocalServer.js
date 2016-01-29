var http = require('http');
var Q = require('q');

var logger = require('./logger').get();

function LocalServer() {
    this.onTestsResults = null;
}

LocalServer.startServer = function(port) {
    var localServer = new LocalServer();

    return Q.promise(function (resolve, reject) {
        http.createServer(localServer.requestListener)
        .listen(port, '127.0.0.1',function (server) {
            localServer._server = server;
            resolve(localServer);
        });
    });
};

LocalServer.prototype.requestListener = function (request, response) {
    var me = this;

    if (request.method === 'PUT' || request.method === 'POST') {
        var body = '';
        request.on('data', function (data) {
            body += data;
            // Too much POST data, kill the connection!
            if (body.length > 1e6) {
                request.connection.destroy();
            }
        });
        request.on('end', function (res) {
            if(body.indexOf("mobilespec")  === 2){ // {\"mobilespec\":{...}}
                try {
                    var results = JSON.parse(body);
                    logger.info("local-server: received tests results");
                    logger.verbose(body);

                    if (me.onTestsResults) {
                        me.onTestsResults(results);
                    }
                }
                catch(err) {
                    logger.error("local-server: parse error :: " + err);
                }
            }
            else {
                logger.normal("local-server: console-log:" + body);
            }
        });
    }
    else {
        logger.verbose("local-server: received " + request.method + " request") ;
        response.writeHead(200, { 'Content-Type': 'text/plain'});
        response.write("Hello"); // sanity check to make sure server is running
        response.end();
    }
};

module.exports = LocalServer;
