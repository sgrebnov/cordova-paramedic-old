var net = require('net');
var Q = require('q');
var PORT_NOT_AVAILABLE = 'EADDRINUSE';

var isPortAvailable = function (port) {
    return new Q.Promise(function(resolve, reject) {
        var testServer = net.createServer()
            .once('error', function(err) {
                if (err.code === PORT_NOT_AVAILABLE) {
                    reject(new Error('Port is not available'));
                } else {
                    reject(err);
                }
            })
            .once('listening', function() {
                testServer.once('close', function() {
                    resolve(port);
                }).close();
            })
            .listen(port);
    });
};

var checkPorts = function(startPort, endPort, onFoundPort, onError) {
    var currentPort = startPort;

    isPortAvailable(currentPort)
        .then(function(port) {
            onFoundPort(port);
        }, function(error) {
            if (error.message === 'Port is not available') {
                    currentPort++;
                    if (currentPort > endPort) {
                        onError(new Error('All ports are unavailable!'));
                    } else {
                        checkPorts(currentPort, endPort, onFoundPort, onError);
                    }
                } else onError(error);
        });
    };

var getFirstAvailablePort = function (startPort, endPort) {
    if (startPort > endPort) {
        var buffer = startPort;
        startPort = endPort;
        endPort = buffer;
    }

    return new Q.Promise(function(resolve, reject) {
        checkPorts(startPort, endPort, resolve, reject);
    });
};

module.exports.getFirstAvailablePort = getFirstAvailablePort;
