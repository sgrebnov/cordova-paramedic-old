var Q = require('q');
var io = require('socket.io');

var logger = require('./logger').get();

var specReporters = require('./specReporters');

function LocalServer(port, externalServerUrl) {
    this.port = port;
    this.externalServerUrl = externalServerUrl;
    this.onTestsResults = null;
}

LocalServer.startServer = function(port, externalServerUrl) {
    var localServer = new LocalServer(port, externalServerUrl);
    localServer.createSocketListener();
    return Q.resolve(localServer);
};

LocalServer.prototype.createSocketListener = function() {
    var listener = io.listen(this.port, {
        pingTimeout: 60000, // how many ms without a pong packet to consider the connection closed
        pingInterval: 25000 // how many ms before sending a new ping packet
    });

    var me  = this;

    listener.on('connection', function(socket) {
        logger.info('local-server: new socket connection');
        me.connection = socket;

        socket.on('log', me.onDeviceLog);

        socket.on('disconnect', function() {
            me.onTestsCompletedOrDisconnected();
        });

        socket.on('jasmineStarted', function(data) {
            specReporters.jasmineStarted(data);
        });

        socket.on('specStarted', function(data) {
            specReporters.specStarted(data);
        });

        socket.on('specDone', function(data) {
            specReporters.specDone(data);
        });

        socket.on('suiteStarted', function(data) {
            specReporters.suiteStarted(data);
        });

        socket.on('suiteDone', function(data) {
            specReporters.suiteDone(data);
        });

        socket.on('jasmineDone', function(data) {
            specReporters.jasmineDone(data);
            // save results to report them later
            me.onTestsCompleted();
            // disconnect because all tests have been completed
            socket.disconnect();
        });
    });
};

LocalServer.prototype.reset = function() {
    this.onTestsResults = null;
    if (this.connection) {
        this.connection.disconnect();
        this.connection = null;
    }

    specReporters.reset();
}

LocalServer.prototype.onDeviceLog = function(data) {
    logger.verbose('device|console.'+data.type + ': '  + data.msg[0]);
};

LocalServer.prototype.onTestsCompleted = function(msg) {
    logger.normal('local-server: tests completed');
    this.lastMobileSpecResults = specReporters.getResults();
};

LocalServer.prototype.onTestsCompletedOrDisconnected = function() {
    logger.info('local-server: tests have been completed or test device has disconnected');
    if (this.onTestsResults) {
        this.onTestsResults(this.lastMobileSpecResults);
    }
    this.lastMobileSpecResults = null;
};

module.exports = LocalServer;
