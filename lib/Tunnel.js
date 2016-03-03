 var exec = require('./utils').exec;
 var path = require('path');
 var Q = require('Q');

function Tunnel(port) {
    this.port = port;
}

Tunnel.prototype.createTunnel = function() {
    var self = this;
    //TODO: use localtunnel module instead of shell
    return Q.Promise(function(resolve, reject) {
        exec(path.resolve(__dirname, '../node_modules/.bin/lt') + ' --port ' + self.port, null, function(output) {
            resolve(output.split(' ')[3]);
        });
    });
};

module.exports = Tunnel;