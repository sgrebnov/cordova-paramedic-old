#!/usr/bin/env node

var localtunnel = require('localtunnel'),
    parseArgs = require('minimist'),
    shell = require('shelljs'),
    fs = require('fs'),
    request = require('request'),
    Server = require('./LocalServer'),
    Q = require('q'),
    tmp = require('tmp'),
    PluginsManager = require('./PluginsManager'),
    Target = require('./Target'),
    path = require('path');

var Q = require('q');
var logger = require('./logger').get();
var ConfigParser = require('cordova-common').ConfigParser;

var PORT = 8008;
var TIMEOUT = 10 * 60 * 1000; // 10 minutes in msec - this will become a param

var SUPPORTED_PLATFORMS = [
    "ios",
    "browser",
    "windows",
    "android",
    "wp8"
];

function ParamedicRunner(targets,_plugins,_callback,nPort,msTimeout,bSilent,bVerbose,platformPath) {
    this.tunneledUrl = "";
    this.port = nPort;
    this.targets = targets;
    this.plugins = _plugins;
    this.tempFolder = null;
    this.pluginsManager = null;
    this.timeout = msTimeout;
    this.verbose = bVerbose;
    this.platformPath = platformPath;

    logger.setLevel('verbose');
}

ParamedicRunner.prototype = {
    run: function() {
        var cordovaResult = shell.exec('cordova --version', {silent:!this.verbose});
        if(cordovaResult.code) {
            logger.error(cordovaResult.output);
            // this would be fatal
            process.exit(cordovaResult.code);
        }

        var self = this;

        this.createTempProject();
        this.installPlugins();

         // Set up start page for tests
        logger.normal("cordova-paramedic: setting app start page to test page");
        shell.sed('-i', 'src="index.html"', 'src="cdvtests/index.html"', 'config.xml');

        logger.info("cordova-paramedic: starting local medic server on port " + this.port);
        return Server.startServer(this.port).then(function (server) {
            return self.targets
            .reduce(function (promise, target) {

                return promise
                .then(function () {
                    if (!~SUPPORTED_PLATFORMS.indexOf(target.platformId)) {
                        logger.warn("platform is not supported :: " + self.platformId);
                        return;
                    }

                    switch(target.platformId) {
                        case "ios"     :  // intentional fallthrough
                        case "browser" :
                        case "windows" :
                            return self.writeMedicLogUrl("http://127.0.0.1:" + self.port);
                        case "android" :
                            return self.writeMedicLogUrl("http://10.0.2.2:" + self.port);
                        case "wp8" :
                            //localtunnel(PORT, tunnelCallback);
                            return Q.promise(function (resolve) {
                                request.get('http://google.com/', function(e, res, data) {
                                    if(e) {
                                        throw new Error("failed to detect ip address");
                                    }

                                    var ip = res.req.connection.localAddress ||
                                             res.req.socket.localAddress;
                                    self.logMessage("Using ip : " + ip);
                                    self.writeMedicLogUrl("http://" + ip + ":" + self.port);
                                    resolve();
                                });
                            });
                    }
                })
                .then(function () {
                    return self.addAndRunPlatform(target);
                })
                .then(function () {
                    return Q.Promise(function (resolve, reject) {
                        server.onTestResults = function (results) {
                            logger.results(results);
                            resolve();
                        };
                    });
                })
                // .timeout( self.timeout/self.targets.length )
                .then(function () {
                    shell.cd(self.storedCWD);
                    shell.exec('cordova platform rm ' + platformId);
                });
            }, Q());
        });

        // TODO: need to cleanup after all
        // shell.cd(this.storedCWD);
        // the TMP_FOLDER.removeCallback() call is throwing an exception, so we explicitly delete it here
        // shell.exec('rm -rf ' + this.tempFolder.name);
        // this.callback(exitCode,resultsObj, null);
    },
    createTempProject: function() {
        this.tempFolder = tmp.dirSync();
        tmp.setGracefulCleanup();
        logger.info("cordova-paramedic: creating temp project at " + this.tempFolder.name);
        shell.exec('cordova create ' + this.tempFolder.name,{silent:!this.verbose});
        shell.cd(this.tempFolder.name);
    },
    installPlugins: function() {
        logger.info("cordova-paramedic: installing plugins");
        this.pluginsManager = new PluginsManager(this.tempFolder.name);
        this.pluginsManager.installPlugins(this.plugins);
        this.pluginsManager.installTestsForExistingPlugins();
        this.pluginsManager.installSinglePlugin('cordova-plugin-test-framework');
        this.pluginsManager.installSinglePlugin(path.join(__dirname, '../paramedic-plugin'));
    },
    writeMedicLogUrl: function(url) {
        logger.normal("cordova-paramedic: writing medic log url to project");
        var obj = {logurl:url};
        fs.writeFileSync(path.join("www","medic.json"),JSON.stringify(obj));
    },
    addAndRunPlatform: function(target) {
        var self = this;
        var browserify = target.browserify ? "--browserify" : "";

        logger.info("cordova-paramedic: adding platform : " + target.platform);
        shell.exec('cordova platform add ' + target.platformId,{silent:!this.verbose});
        shell.exec('cordova prepare '+ browserify,{silent:!this.verbose});

        var cmd = 'cordova emulate ' + target.platformId + " --phone";
        if(target.action !== "run") {
            cmd = 'cordova ' + target.action + " " + target.platformId;
        }

        logger.normal('cordova-paramedic: ' + cmd);

        return Q.Promise(function (resolve) {
            shell.exec(cmd, {async:true, silent: !self.verbose},
                function(code, output){
                    if(code) {
                        throw new Error("cordova build returned error code " + code + "\noutput: " + output);
                    }

                    resolve();
                }
            );
        });
    },
    tunnelCallback: function(err, tunnel) {
        if (err){
            logger.error("failed to create tunnel url, check your internet connectivity.");
            this.cleanUpAndExitWithCode(1);
        }
        else {
            // the assigned public url for your tunnel
            // i.e. https://abcdefgjhij.localtunnel.me
            this.tunneledUrl = tunnel.url;
            logger.normal("cordova-paramedic: tunneledURL = " + tunneledUrl);
            this.writeMedicLogUrl(tunneledUrl);
            this.addAndRunPlatform();
        }
    }
};

var storedCWD =  null;

function parseTargetsFromConfig(paramedicConfigPath) {
    var config = JSON.parse(fs.readFileSync(paramedicConfigPath, 'utf8'));
    return config.targets.map(function(target) {
        return new Target(target);
    });
}

function parsePluginsFromConfig(paramedicConfigPath) {
    var config = JSON.parse(fs.readFileSync(paramedicConfigPath, 'utf8'));
    return config.plugins;
}

exports.run = function(paramedicConfig,_platformId,_plugins,_callback,bJustBuild,nPort,msTimeout,bBrowserify,bSilent,bVerbose,platformPath) {

    storedCWD = storedCWD || process.cwd();
    if(!_plugins) {
        _plugins = process.cwd();
    }

    var targets = null;
    var plugins = null;
    // TODO hide paramedicConfig vs argv options to a separate class
    if (paramedicConfig) {
        targets = parseTargetsFromConfig(paramedicConfig);
        plugins = parsePluginsFromConfig(paramedicConfig);
    } else {
        if (!_platformId) {
            console.error("Error : Missing platformId");
            return;
        } else {
            // TODO platformPath support
            targets = [new Target({
                platform: _platformId,
                actions: !!bJustBuild ? 'build' : 'run',
                args: null,
                browserify: !!bBrowserify
            })];
            // make it an array if it's not
            plugins = Array.isArray(_plugins) ? _plugins : [_plugins];
        }
    }

    if (!plugins || plugins.length === 0) {
        console.error("Error : Missing plugins");
        return;
    }

    var runner = new ParamedicRunner(targets, plugins, _callback,
        nPort || PORT, msTimeout || TIMEOUT, !!bVerbose);

    runner.storedCWD = storedCWD;
    return runner.run()
    .timeout(msTimeout || TIMEOUT, "This test seems to be blocked :: timeout exceeded. Exiting ...");
};