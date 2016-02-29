#!/usr/bin/env node

var shell = require('shelljs'),
    Server = require('./LocalServer'),
    Q = require('q'),
    tmp = require('tmp'),
    PluginsManager = require('./PluginsManager'),
    TestsRunner = require('./TestsRunner'),
    portScanner = require('./portScanner'),
    path = require('path'),
    Target = require('./Target'),
    ParamedicConfig = require('./ParamedicConfig');

var Q = require('q');
var logger = require('./logger').get();

var START_PORT = 8008;
var END_PORT = 8009;
var TIMEOUT = 10 * 60 * 1000; // 10 minutes in msec - this will become a param


function ParamedicRunner(targets,_plugins,_callback,nStartPort,nEndPort,msTimeout,bSilent,bVerbose,platformPath,externalServerUrl) {
    this.tunneledUrl = "";
    this.startPort = nStartPort;
    this.endPort = nEndPort;
    this.targets = targets;
    this.plugins = _plugins;
    this.tempFolder = null;
    this.pluginsManager = null;
    this.timeout = msTimeout;
    this.verbose = bVerbose;
    this.platformPath = platformPath;
    this.externalServerUrl = externalServerUrl;

    this.testsPassed = true;

    logger.setLevel('verbose');
}

ParamedicRunner.prototype = {
    run: function() {
        var cordovaVersion = shell.exec('cordova --version', {silent: true});
        var npmVersion = shell.exec('npm -v', {silent: true});

        if (cordovaVersion.code || npmVersion.code) {
            logger.error(cordovaVersion.output + npmVersion.output);
            process.exit(1);
        }

        if (this.verbose) {
            logger.info("cordova-paramedic: using cordova version " + cordovaVersion.output.replace('\n', ''));
            logger.info("cordova-paramedic: using npm version " + npmVersion.output.replace('\n', ''));
        }

        var self = this;

        this.createTempProject();
        this.installPlugins();

         // Set up start page for tests
        logger.normal("cordova-paramedic: setting app start page to test page");
        shell.sed('-i', 'src="index.html"', 'src="cdvtests/index.html"', 'config.xml');
        logger.info("cordova-paramedic: scanning ports from " + this.startPort + " to " + this.endPort);

        return portScanner.getFirstAvailablePort(this.startPort, this.endPort).then(function(port) {
            self.port = port;

            logger.info("cordova-paramedic: port " + port + " is available. Starting local medic server");
            return Server.startServer(port, self.externalServerUrl);
        }).then(function (server) {

            var testsRunner = new TestsRunner(server);

            return self.targets.reduce(function (promise, target) {

                return promise.then( function() {

                    return testsRunner.runSingleTarget(target).then(function(results) {
                        if (results instanceof Error) {
                            self.testsPassed = false;
                            return logger.error(results.message);
                        }

                        logger.info("cordova-paramedic: tests done for platform " + target.platform);

                        var targetTestsPassed = results && results.passed;
                        self.testsPassed = self.testsPassed && targetTestsPassed;

                        if (!results) {
                            logger.error("Result: tests has not been completed in time, crashed or there is connectivity issue.");
                        } else if (targetTestsPassed)  {
                            logger.info("Result: passed");
                        } else {
                            logger.error("Result: passed=" + results.passed + ", failures=" + results.mobilespec.failures);
                        }
                    });
                });
            }, Q());
        }).then(function(res) {
            if (self.testsPassed) {
                logger.info("All tests have been passed.");
                process.exit(0);
            } else {
                logger.error("There are tests failures.");
                process.exit(1);
            }
        }, function(err) {
            logger.error("Failed: " + err);
            process.exit(2);
        });


        // TODO  final done(win, fail)

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
    }
};

var storedCWD =  null;

exports.run = function(paramedicConfig,_platformId,_plugins,_callback,bJustBuild,nStartPort,nEndPort,msTimeout,bBrowserify,bSilent,bVerbose,platformPath) {

    storedCWD = storedCWD || process.cwd();
    if(!_plugins) {
        _plugins = process.cwd();
    }

    var targets = null;
    var plugins = null;

    if (paramedicConfig) {
        paramedicConfig = new ParamedicConfig(paramedicConfig);
        targets = paramedicConfig.getTargets();
        plugins = paramedicConfig.getPlugins();
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
        nStartPort || START_PORT, nEndPort || END_PORT, msTimeout || TIMEOUT, !!bVerbose, bVerbose, null, paramedicConfig ? paramedicConfig.getExternalServerUrl() : null);

    runner.storedCWD = storedCWD;
    return runner.run()
    .timeout(msTimeout || TIMEOUT, "This test seems to be blocked :: timeout exceeded. Exiting ...");
};