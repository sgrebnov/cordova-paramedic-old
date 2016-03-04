var Q = require('q');
var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var exec = require('./utils').exec;

var logger = require('./logger').get();

var SUPPORTED_PLATFORMS = [
    "ios",
    "browser",
    "windows",
    "android",
    "wp8"
];

var MAX_PENDING_TIME = 60000;

function TestsRunner (server) {
    this.server = server;
}


TestsRunner.prototype.runSingleTarget = function (target, savePath) {
    logger.info("Running target: " + target.platform);

    if (SUPPORTED_PLATFORMS.indexOf(target.platformId) === -1) {
        return Q.reject("Platform is not supported :: " + target.platformId);
    }

    var me = this;

    this.server.reset(savePath);

    return this.prepareAppToRunTarget(target).then(function() {
        return me.installPlatform(target);
    }).then(function() {
        return me.checkPlatform(target);
    }).then(function() {
        return me.runTests(target);
    })
    // .timeout( self.timeout/self.targets.length )
    .then(function (results) {
 //       shell.cd(self.storedCWD);
        logger.normal("Removing platform: " + target.platformId);
        exec('cordova platform rm ' + target.platformId);

        return results;
    })
    .catch(function(error) {return error;});
};

TestsRunner.prototype.prepareAppToRunTarget = function(target) {
    var me = this;
    return Q.Promise(function(resolve, reject) {
        // if we know external url we can safely use it
        if (me.server.haveConnectionUrl()) {
            me.writeMedicLogUrl(me.server.getConnectionUrl());
        } else {
            // otherwise, we assume we use local PC and platforms emulators
            switch(target.platformId) {
                case "ios"     :  // intentional fallthrough
                case "browser" :
                case "windows" :
                    me.writeMedicLogUrl("http://127.0.0.1:" + me.server.port);
                    break;
                case "android":
                    me.writeMedicLogUrl("http://10.0.2.2:" + me.server.port);
                    break;
            }
        }
        resolve();
    });
};

TestsRunner.prototype.installPlatform = function(target) {
    return Q.Promise(function(resolve, reject) {
        logger.normal("cordova-paramedic: adding platform : " + target.platform);
        exec('cordova platform add ' + target.platform);
        resolve();
    });
};

TestsRunner.prototype.checkPlatform = function(target) {
    return Q.Promise(function(resolve, reject) {
        logger.normal("cordova-paramedic: checking requirements for platform " + target.platformId);
        var result = exec('cordova requirements ' + target.platformId);
        if (result.code !== 0) {
            reject(new Error('Platform requirements check has failed! Skipping...'));
        } else resolve();
    });
};

TestsRunner.prototype.writeMedicLogUrl = function(url) {
    logger.normal("cordova-paramedic: writing medic log url to project " + url);
    var obj = {logurl:url};
    fs.writeFileSync(path.join("www","medic.json"), JSON.stringify(obj));
};

TestsRunner.prototype.runTests = function(target) {
    logger.normal('Starting tests');
    var self = this;

    var cmd = "cordova " + target.action + " " + target.platformId;
    if (target.args) {
        cmd += " " + target.args;
    }

    logger.normal('cordova-paramedic: running command ' + cmd);

    return Q.Promise(function (resolve, reject) {
        logger.normal('Waiting for tests result');

        self.server.onTestsResults = function (results) {
            resolve(results);
        };

        exec(cmd, function(code, output){
                if(code) {
                    reject(new Error("cordova build returned error code " + code));
                }

                var waitForTestResults = target.action === 'run' || target.action === 'emulate';

                if (!waitForTestResults) resolve({passed: true}); // skip tests if it was justbuild

                setTimeout(function(){
                    if (!self.server.connection)
                        reject(new Error("Seems like device not connected to local server in " + MAX_PENDING_TIME / 1000 + " secs. Skipping this platform..."));
                }, MAX_PENDING_TIME);
            }
        );
    });
};

module.exports = TestsRunner;
