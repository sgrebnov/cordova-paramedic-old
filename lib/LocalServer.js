var Q = require('q');
var io = require('socket.io');

var logger = require('./logger').get();

var ConsoleReporter = require('./ConsoleReporter');
var reporter = new ConsoleReporter({print: process.stdout.write, showColors: true});
// var SpecReporter = require('jasmine-spec-reporter');
// var reporter = new SpecReporter({
//     displayPendingSummary: false,
//     displaySuiteNumber: true
// });

function LocalServer() {
    this.onTestsResults = null;
}

LocalServer.startServer = function(port) {
    var localServer = new LocalServer();
    localServer.createSocketListener(port);
    return Q.resolve(localServer);
};

LocalServer.prototype.createSocketListener = function(port) {
    var listener = io.listen(port, {
        pingTimeout: 60000, // how many ms without a pong packet to consider the connection closed
        pingInterval: 25000 // how many ms before sending a new ping packet
    });

    var me  = this;

    //Listen for connection
    listener.on('connection', function(socket) {
        logger.info('local-server: new socket connection');

        socket.on('log', me.onDeviceLog);

        socket.on('disconnect', me.onTestsCompletedOrDisconnected.bind(me));

        socket.on('mobilespec-results', function(msg) {
            me.onTestsResults(msg);
            // done
            socket.disconnect();
        });

        socket.on('jasmineStarted', function(data) {
            reporter.jasmineStarted(data);
        });

        socket.on('specStarted', function(data) {
            reporter.specStarted(data);
        });

        socket.on('specDone', function(data) {
            reporter.specDone(data);
        });

        socket.on('suiteStarted', function(data) {
            reporter.suiteStarted(data);
        });

        socket.on('suiteDone', function(data) {
            reporter.suiteDone(data);
        });

        socket.on('jasmineDone', function(data) {
            reporter.jasmineDone(data);
            me.onMobileSpecResults();
            socket.disconnect();
        });
    });
};

LocalServer.prototype.onDeviceLog = function(data) {
    logger.verbose('device|console.'+data.type + ': '  + data.msg[0]);
};

LocalServer.prototype.onMobileSpecResults = function(msg) {
    logger.normal('local-server: onMobileSpecResults');
};

LocalServer.prototype.onTestsCompletedOrDisconnected = function() {
    logger.info('local-server: onTestsCompletedOrDisconnected');
    if (this.onTestsResults) {
        this.onTestsResults(this.lastMobileSpecResults);
    }
    this.lastMobileSpecResults = null;
};

module.exports = LocalServer;
