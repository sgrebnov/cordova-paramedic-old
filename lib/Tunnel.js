 var shell = require('shelljs');
 var Q = require('Q');

function Tunnel(port) {
    this.port = port;
}

Tunnel.prototype.createTunnel = function() {
    var self = this;
    //TODO: use localtunnel module instead of shell 
    return Q.Promise(function(resolve, reject) {
        var localTunnel = shell.exec('lt --port ' + self.port, {async: true, silent: true});

        localTunnel.stdout.on('data', function(data) {
            resolve(data.split(' ')[3]);
        });
    });
};

module.exports = Tunnel;