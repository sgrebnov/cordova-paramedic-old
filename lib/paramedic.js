#!/usr/bin/env node

var exec = require('./utils').exec,
    shell = require('shelljs'),
    Server = require('./LocalServer'),
    Q = require('q'),
    tmp = require('tmp'),
    PluginsManager = require('./PluginsManager'),
    specReporters = require('./specReporters'),
    TestsRunner = require('./TestsRunner'),
    portScanner = require('./portScanner'),
    path = require('path'),
    Tunnel = require('./Tunnel');

var Q = require('q');
var logger = require('./logger').get();

var TESTS_PASS = 0;
var TESTS_FAILURE = 1;
var NONTESTS_FAILURE = 2;

function ParamedicRunner(config, _callback) {
    this.tunneledUrl = "";
    this.tempFolder = null;
    this.pluginsManager = null;
    this.testsPassed = true;

    this.config = config;

    exec.setVerboseLevel(config.isVerbose());
    logger.setLevel(config.isVerbose() ? 'verbose' : 'normal');
}

ParamedicRunner.prototype = {
    run: function() {
        var cordovaVersion = exec('cordova --version');
        var npmVersion = exec('npm -v');

        if (cordovaVersion.code || npmVersion.code) {
            logger.error(cordovaVersion.output + npmVersion.output);
            process.exit(1);
        }

        logger.normal("cordova-paramedic: using cordova version " + cordovaVersion.output.replace('\n', ''));
        logger.normal("cordova-paramedic: using npm version " + npmVersion.output.replace('\n', ''));

        var self = this;

        this.createTempProject();
        this.installPlugins();

         // Set up start page for tests
        logger.normal("cordova-paramedic: setting app start page to test page");
        shell.sed('-i', 'src="index.html"', 'src="cdvtests/index.html"', 'config.xml');

        var startPort = this.config.getPorts().start,
            endPort   = this.config.getPorts().end;
        logger.info("cordova-paramedic: scanning ports from " + startPort + " to " + endPort);

        // Initialize test reporters
        specReporters.initialize(this.config);

        return portScanner.getFirstAvailablePort(startPort, endPort).then(function(port) {
            self.port = port;

            logger.info("cordova-paramedic: port " + port + " is available");

            if (self.config.useTunnel()) {
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
            return Server.startServer(self.port, self.config.getExternalServerUrl(), self.tunneledUrl);
        }).then(function (server) {

            var testsRunner = new TestsRunner(server);

            return self.config.getTargets().reduce(function (promise, target) {

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
                return TESTS_PASS;
            } else {
                logger.error("There are tests failures.");
                return TESTS_FAILURE;
            }
        }, function(err) {
            logger.error("Failed: " + err);
            return NONTESTS_FAILURE;
        }).then(function(exitCode){
            if(self.config.shouldCleanUpAfterRun()) {
                logger.info("cordova-paramedic: Deleting the application: " + self.tempFolder.name);
                shell.popd();
                shell.rm('-rf', self.tempFolder.name);
            }
            process.exit(exitCode);
        });
    },
    createTempProject: function() {
        this.tempFolder = tmp.dirSync();
        tmp.setGracefulCleanup();
        logger.info("cordova-paramedic: creating temp project at " + this.tempFolder.name);
        exec('cordova create ' + this.tempFolder.name);
        shell.pushd(this.tempFolder.name);
    },
    installPlugins: function() {
        logger.info("cordova-paramedic: installing plugins");
        this.pluginsManager = new PluginsManager(this.tempFolder.name, this.storedCWD);
        this.pluginsManager.installPlugins(this.config.getPlugins());
        this.pluginsManager.installTestsForExistingPlugins();
        this.pluginsManager.installSinglePlugin('cordova-plugin-test-framework');
        this.pluginsManager.installSinglePlugin('cordova-plugin-device');
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