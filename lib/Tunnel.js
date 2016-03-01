 var shell = require('shelljs');
 var path = require('path');
 var Q = require('Q');

function Tunnel(port) {
    this.port = port;
}

Tunnel.prototype.createTunnel = function() {
    var self = this;
    //TODO: use localtunnel module instead of shell
    return Q.Promise(function(resolve, reject) {
        var localTunnel = shell.exec(path.resolve(__dirname, '../node_modules/.bin/lt') + ' --port ' + self.port, {async: true});

        localTunnel.stdout.on('data', function(data) {
            resolve(data.split(' ')[3]);
        });
    });
};

module.exports = Tunnel;