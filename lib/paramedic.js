#!/usr/bin/env node

var http = require('http'),
    localtunnel = require('localtunnel'),
    parseArgs = require('minimist'),
    shell = require('shelljs'),
    fs = require('fs'),
    request = require('request'),
    tmp = require('tmp'),
    PluginsManager = require('./PluginsManager'),
    Target = require('./Target'),
    path = require('path');

var PORT = 8008;
var TIMEOUT = 10 * 60 * 1000; // 10 minutes in msec - this will become a param

function ParamedicRunner(targets,_plugins,_callback,nPort,msTimeout,bSilent,bVerbose,platformPath) {
    this.tunneledUrl = "";
    this.port = nPort;
    this.targets = targets;
    this.plugins = _plugins;
    this.callback = _callback;
    this.tempFolder = null;
    this.pluginsManager = null;
    this.timeout = msTimeout;
    this.verbose = bVerbose;
    this.platformPath = platformPath;

    if(bSilent) {
        var logOutput = this.logOutput = [];
        this.logMessage = function(msg) {
            logOutput.push(msg);
        };
    }
    else {
        this.logMessage = function(msg) {
            console.log(msg);
        };
    }
}

ParamedicRunner.prototype = {
    run: function() {
        var cordovaResult = shell.exec('cordova --version', {silent:!this.verbose});
        if(cordovaResult.code) {
            this.logMessage(cordovaResult.output);
            // this would be fatal
            process.exit(cordovaResult.code);
        }

        // limit runtime to TIMEOUT msecs
        var self = this;
        setTimeout(function(){
            self.logMessage("This test seems to be blocked :: timeout exceeded. Exiting ...");
            self.cleanUpAndExitWithCode(1);
        },self.timeout);

        this.createTempProject();
        this.installPlugins();
        this.startServer();
    },
    createTempProject: function() {
        this.tempFolder = tmp.dirSync();
        tmp.setGracefulCleanup();
        this.logMessage("cordova-paramedic: creating temp project at " + this.tempFolder.name);
        shell.exec('cordova create ' + this.tempFolder.name,{silent:!this.verbose});
        shell.cd(this.tempFolder.name);
    },
    installPlugins: function() {
        this.pluginsManager = new PluginsManager(this.tempFolder.name);
        this.pluginsManager.installPlugins(this.plugins);
        this.pluginsManager.installTestsForExistingPlugins();
        this.pluginsManager.installSinglePlugin('cordova-plugin-test-framework');
    },
    removePlatform: function(platformId) {
        shell.cd(this.storedCWD);
        shell.exec('cordova platform rm ' + platformId);
    },
    cleanUpAndExitWithCode: function(exitCode,resultsObj) {
        shell.cd(this.storedCWD);
        // the TMP_FOLDER.removeCallback() call is throwing an exception, so we explicitly delete it here
        shell.exec('rm -rf ' + this.tempFolder.name);
        var logStr = this.logOutput ? this.logOutput.join("\n") : null;
        this.callback(exitCode,resultsObj,logStr);
    },
    writeMedicLogUrl: function(url) {
        this.logMessage("cordova-paramedic: writing medic log url to project");
        var obj = {logurl:url};
        fs.writeFileSync(path.join("www","medic.json"),JSON.stringify(obj));
    },
    setConfigStartPage: function() {
        this.logMessage("cordova-paramedic: setting app start page to test page");
        var fileName = 'config.xml';
        var configStr = fs.readFileSync(fileName).toString();
        if(configStr) {
            configStr = configStr.replace("src=\"index.html\"","src=\"cdvtests/index.html\"");
            fs.writeFileSync(fileName, configStr);
        }
        else {
            this.logMessage("Oops, could not find config.xml");
        }
    },
    startServer: function() {

        if(this.justBuild) {
            this.addAndRunPlatform();
            return;
        }
        /// else ....

        this.logMessage("cordova-paramedic: starting local medic server " + this.platformId);
        var self = this;
        var server = http.createServer(this.requestListener.bind(this));
        
        server.listen(this.port, '127.0.0.1',function onServerConnect() {

            self.targets.forEach(function(target){

                switch(target.platformId) {
                    case "ios"     :  // intentional fallthrough
                    case "browser" :
                    case "windows" :
                        self.writeMedicLogUrl("http://127.0.0.1:" + self.port);
                        self.addAndRunPlatform(target);
                        break;
                    case "android" :
                        self.writeMedicLogUrl("http://10.0.2.2:" + self.port);
                        self.addAndRunPlatform(target);
                        break;
                    case "wp8" :
                        //localtunnel(PORT, tunnelCallback);
                        request.get('http://google.com/', function(e, res, data) {
                            if(e) {
                                self.logMessage("failed to detect ip address");
                                self.cleanUpAndExitWithCode(1);
                            }
                            else {
                                var ip = res.req.connection.localAddress ||
                                         res.req.socket.localAddress;
                                self.logMessage("Using ip : " + ip);
                                self.writeMedicLogUrl("http://" + ip + ":" + self.port);
                                self.addAndRunPlatform(target);
                            }
                        });
                        break;
                    default :
                        self.logMessage("platform is not supported :: " + self.platformId);
                        self.cleanUpAndExitWithCode(1);
                        break;
                }
            });

        });
    },
    requestListener: function(request, response) {
        var self = this;
        if (request.method == 'PUT' || request.method == 'POST') {
            var body = '';
            request.on('data', function (data) {
                body += data;
                // Too much POST data, kill the connection!
                if (body.length > 1e6) {
                    req.connection.destroy();
                }
            });
            request.on('end', function (res) {
                if(body.indexOf("mobilespec")  == 2){ // {\"mobilespec\":{...}}
                    try {
                        //logMessage("body = " + body);
                        var results = JSON.parse(body);
                        self.logMessage("Results: ran " + 
                                        results.mobilespec.specs + 
                                        " specs with " + 
                                        results.mobilespec.failures + 
                                        " failures");
                        if(results.mobilespec.failures > 0) {
                            self.cleanUpAndExitWithCode(1,results);
                        }
                        else {
                            self.cleanUpAndExitWithCode(0,results);
                        }
                        
                    }
                    catch(err) {
                        self.logMessage("parse error :: " + err);
                        self.cleanUpAndExitWithCode(1);
                    }
                }
                else {
                    self.logMessage("console-log:" + body);
                }
            });
        }
        else {
            self.logMessage(request.method);
            response.writeHead(200, { 'Content-Type': 'text/plain'});
            response.write("Hello"); // sanity check to make sure server is running
            response.end();
        }
    },
    addAndRunPlatform: function(target) {
        var self = this;

        this.logMessage("cordova-paramedic: adding platform : " + target.platform);

        var browserify = target.browserify ? "--browserify" : "";

        shell.exec('cordova platform add ' + target.platformId,{silent:!this.verbose});
        shell.exec('cordova prepare '+ browserify,{silent:!this.verbose});

        if(target.action !== "run") {

            this.logMessage("building ...");
            
            shell.exec('cordova ' + target.action + " " + target.platformId,
                {async:true,silent:!this.verbose},
                function(code,output){
                    if(code !== 0) {
                        self.logMessage("Error: cordova build returned error code " + code);
                        self.logMessage("output: " + output);
                        self.cleanUpAndExitWithCode(1);
                    }
                    else {
                        removePlatform(target.platformId);
                        //self.cleanUpAndExitWithCode(0);
                    }
                }
            );
        }
        else {
            this.setConfigStartPage();

            shell.exec('cordova emulate ' + this.platformId + " --phone",
                {async:true,silent:!this.verbose},
                function(code,output){
                    if(code !== 0) {
                        self.logMessage("Error: cordova emulate return error code " + code);
                        self.logMessage("output: " + output);
                        self.cleanUpAndExitWithCode(1);
                    }
                }
            );
        }
    },
    tunnelCallback: function(err, tunnel) {
        if (err){
            this.logMessage("failed to create tunnel url, check your internet connectivity.");
            this.cleanUpAndExitWithCode(1);
        }
        else {
            // the assigned public url for your tunnel
            // i.e. https://abcdefgjhij.localtunnel.me
            this.tunneledUrl = tunnel.url;
            this.logMessage("cordova-paramedic: tunneledURL = " + tunneledUrl);
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

    // if we are passed a callback, we will use it,
    // otherwise just make a quick and dirty one
    var callback = ( _callback && _callback.apply ) ? _callback : function(resCode,resObj) {
        process.exit(resCode);
    };

    var runner = new ParamedicRunner(targets, plugins, callback,
        nPort || PORT, msTimeout || TIMEOUT, !!bVerbose);

    runner.storedCWD = storedCWD;
    return runner.run();
};
