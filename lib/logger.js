/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

var ansi = require('ansi');
var EventEmitter = require('events').EventEmitter;
var CordovaError = require('cordova-common').CordovaError;
var EOL = require('os').EOL;

var INSTANCE;

function CordovaLogger () {
    this.levels = {};
    this.colors = {};
    this.stdout = process.stdout;
    this.stderr = process.stderr;

    this.stdoutCursor = ansi(this.stdout);
    this.stderrCursor = ansi(this.stderr);

    this.addLevel('verbose', 1000, 'grey');
    this.addLevel('normal' , 2000);
    this.addLevel('warn'   , 2000, 'yellow');
    this.addLevel('info'   , 3000, 'blue');
    this.addLevel('error'  , 5000, 'red');
    this.addLevel('results' , 10000);

    this.setLevel('normal');
}

CordovaLogger.get = function () {
    return INSTANCE || (INSTANCE = new CordovaLogger());
};

CordovaLogger.VERBOSE = 'verbose';
CordovaLogger.NORMAL = 'normal';
CordovaLogger.WARN = 'warn';
CordovaLogger.INFO = 'info';
CordovaLogger.ERROR = 'error';
CordovaLogger.RESULTS = 'results';

CordovaLogger.prototype.log = function (logLevel, message) {
    // if there is no such logLevel defined, or provided level has
    // less severity than active level, then just ignore this call and return
    if (!this.levels[logLevel] || this.levels[logLevel] < this.levels[this.logLevel])
        // return instance to allow to chain calls
        return this;

    var isVerbose = this.logLevel === 'verbose';
    var cursor = this.stdoutCursor;

    if(message instanceof Error || logLevel === CordovaLogger.ERROR) {
        message = formatError(message, isVerbose);
        cursor = this.stderrCursor;
    }

    var color = this.colors[logLevel];
    if (color) {
        cursor.bold().fg[color]();
    }

    cursor.write(message).reset().write(EOL);

    return this;
};

CordovaLogger.prototype.addLevel = function (level, severity, color) {

    this.levels[level] = severity;

    if (color) {
        this.colors[level] = color;
    }

    // Define own method with corresponding name
    if (!this[level]) {
        this[level] = this.log.bind(this, level);
    }

    return this;
};

CordovaLogger.prototype.setLevel = function (logLevel) {
    this.logLevel = this.levels[logLevel] ? logLevel : CordovaLogger.NORMAL;

    return this;
};

CordovaLogger.prototype.subscribe = function (eventEmitter) {

    if (!(eventEmitter instanceof EventEmitter))
        throw new Error('Must provide a valid EventEmitter instance to subscribe CordovaLogger to');

    var self = this;

    process.on('uncaughtException', function(err) {
        self.error(err);
        process.exit(1);
    });

    eventEmitter.on('verbose', self.verbose)
        .on('log', self.normal)
        .on('info', self.info)
        .on('warn', self.warn)
        .on('warning', self.warn)
        // Set up event handlers for logging and results emitted as events.
        .on('results', self.results);

    return this;
};

function formatError(error, isVerbose) {
    var message = '';

    if(error instanceof CordovaError) {
        message = error.toString(isVerbose);
    } else if(error instanceof Error) {
        if(isVerbose) {
            message = error.stack;
        } else {
            message = error.message;
        }
    } else {
        // Plain text error message
        message = error;
    }

    if(message.toUpperCase().indexOf('ERROR:') !== 0) {
        // Needed for backward compatibility with external tools
        message = 'Error: ' + message;
    }

    return message;
}

module.exports = CordovaLogger;
