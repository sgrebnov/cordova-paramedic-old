#!/usr/bin/env node

var parseArgs = require('minimist'),
    fs = require('fs'),
    path = require('path'),
    paramedic = require('./lib/paramedic');

var plugins,
    platformId;

var USAGE = "Error missing args. \n" +
    "cordova-paramedic --platform PLATFORM --plugin PATH [--justbuild --timeout MSECS --port PORTNUM --browserify]\n" +
    "`PLATFORM` : the platform id, currently only supports 'ios'\n" +
    "`PATH` : the relative or absolute path to a plugin folder\n" +
                    "\texpected to have a 'tests' folder.\n" +  
                    "\tYou may specify multiple --plugin flags and they will all\n" + 
                    "\tbe installed and tested together.\n" +
    "`MSECS` : (optional) time in millisecs to wait for tests to pass|fail \n" +
              "\t(defaults to 10 minutes) \n" +
    "`PORTNUM` : (optional) port to use for posting results from emulator back to paramedic server\n" +
    "--justbuild : (optional) just builds the project, without running the tests \n" +
    "--browserify : (optional) plugins are browserified into cordova.js \n" +
    "--verbose : (optional) verbose mode. Display more information output\n" +
    "--platformPath : (optional) path to install platform from, git or local file uri";

var argv = parseArgs(process.argv.slice(2));

// .paramedic.json represents special configuration file
var paramedicConfig = path.resolve('.paramedic.json');
var useParamedicConfig = process.argv.length === 2 && fs.existsSync(paramedicConfig);

if(!argv.platform && !useParamedicConfig) {
    console.log(USAGE);
    process.exit(1);
}

var onComplete = function(resCode,resObj,logStr) {
    console.log("result code is : " + resCode);
    if(resObj) {
        console.log(JSON.stringify(resObj));
    }
    if(logStr) {
        console.log(logStr);
    }
    process.exit(resCode);
};

paramedic.run(useParamedicConfig ? paramedicConfig : null, argv.platform, argv.plugin, onComplete, argv.justbuild, argv.port, argv.timeout, argv.browserify, false, argv.verbose, argv.platformPath);
