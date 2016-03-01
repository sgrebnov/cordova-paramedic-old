#!/usr/bin/env node

var shell = require('shelljs'),
    Server = require('./LocalServer'),
    Q = require('q'),
    tmp = require('tmp'),
    PluginsManager = require('./PluginsManager'),
    TestsRunner = require('./TestsRunner'),
    portScanner = require('./portScanner'),
    path = require('path'),
    Tunnel = require('./Tunnel');

var Q = require('q');
var logger = require('./logger').get();

function ParamedicRunner(config, _callback) {
    this.tunneledUrl = "";
    this.tempFolder = null;
    this.pluginsManager = null;
    this.testsPassed = true;

    //TODO: refactor
    this.startPort = config.getPorts().start;
    this.endPort   = config.getPorts().end;
    this.targets   = config.getTargets();
    this.plugins   = config.getPlugins();
    this.timeout   = config.getTimeout();
    this.verbose   = config.isVerbose();
    this.useTunnel = config.useTunnel();
    this.externalServerUrl = config.getExternalServerUrl();

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

            logger.info("cordova-paramedic: port " + port + " is available");

            if (self.useTunnel) {
                self.tunnel = new Tunnel(port);
                logger.info('cordova-paramedic: attempt to create local tunnel');
                return self.tunnel.createTunnel();
            }
        }).then(function(url) {
            if (url) {
                logger.info('cordova-paramedic: using tunneled url ' + url);
                self.tunneledUrl = url;
            }

            logger.info("cordova-paramedic: starting local medic server");
            return Server.startServer(self.port, self.externalServerUrl, self.tunneledUrl);
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

exports.run = function(paramedicConfig) {

    storedCWD = storedCWD || process.cwd();

    var runner = new ParamedicRunner(paramedicConfig, null);
    runner.storedCWD = storedCWD;

    return runner.run()
    .timeout(paramedicConfig.getTimeout(), "This test seems to be blocked :: timeout exceeded. Exiting ...");
};