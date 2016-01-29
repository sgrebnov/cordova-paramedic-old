var http = require('http');
var Q = require('q');

var logger = require('./logger').get();

function Server(runner) {
    this.runner = runner;
}

Server.prototype.startServer = function() {
    var runner = this.runner;
    return Q.promise(function (resolve, reject) {
        http.createServer(requestListener.bind(runner))
        .listen(runner.port, '127.0.0.1',function (server) {
            resolve(server);
        });
    });
};

function requestListener(request, response) {
    var self = this;

    if (request.method == 'PUT' || request.method == 'POST') {
        var body = '';
        request.on('data', function (data) {
            body += data;
            // Too much POST data, kill the connection!
            if (body.length > 1e6) {
                request.connection.destroy();
            }
        });
        request.on('end', function (res) {
            if(body.indexOf("mobilespec")  == 2){ // {\"mobilespec\":{...}}
                try {
                    var results = JSON.parse(body);
                    logger.info("Results: ran " +
                                    results.mobilespec.specs +
                                    " specs with " +
                                    results.mobilespec.failures +
                                    " failures");
                    if(results.mobilespec.failures > 0) {
                        self.cleanUpAndExitWithCode(1,results);
                    }
                    else {
                        self.cleanUpAndExitWithCode(0,results);
                    }

                }
                catch(err) {
                    logger.error("parse error :: " + err);
                    self.cleanUpAndExitWithCode(1);
                }
            }
            else {
                logger.normal("console-log:" + body);
            }
        });
    }
    else {
        logger.verbose(request.method);
        response.writeHead(200, { 'Content-Type': 'text/plain'});
        response.write("Hello"); // sanity check to make sure server is running
        response.end();
    }
}

module.exports = Server;
