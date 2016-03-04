
// not currently used
// var ConsoleReporter = require('./reporters/ConsoleReporter');

var ParamedicReporter = require('./reporters/ParamedicReporter');
var JasmineSpecReporter = require('jasmine-spec-reporter');
var jasmineReporters    = require('jasmine-reporters');

// default reporter which is used to determine whether tests pass or not
var paramedicReporter = null;

// all reporters including additional reporters to trace results to console, etc
var reporters = [];

function reset (savePath) {
    paramedicReporter = new ParamedicReporter();
    // default paramedic reporter
    reporters = [paramedicReporter];
    // extra reporters
    reporters.push(new JasmineSpecReporter({displayPendingSummary: false, displaySuiteNumber: true}));
    if(savePath){
        reporters.push(new jasmineReporters.JUnitXmlReporter({savePath: savePath, consolidateAll: false}));
    }
}

module.exports = {
    reset: reset,
    initialize: function() {
        reset();
    },
    getResults: function() {
        return paramedicReporter.getResults();
    },
    jasmineStarted: function(data) {
        reporters.forEach(function (reporter) {
            reporter.jasmineStarted && reporter.jasmineStarted(data);
        });
    },
    specStarted: function(data) {
        reporters.forEach(function (reporter) {
            reporter.specStarted && reporter.specStarted(data);
        });
    },
    specDone: function(data) {
        reporters.forEach(function (reporter) {
            reporter.specDone && reporter.specDone(data);
        });
    },
    suiteStarted: function(data) {
        reporters.forEach(function (reporter) {
            reporter.suiteStarted && reporter.suiteStarted(data);
        });
    },
    suiteDone: function(data) {
        reporters.forEach(function (reporter) {
            reporter.suiteDone && reporter.suiteDone(data);
        });
    },
    jasmineDone: function(data) {
        reporters.forEach(function (reporter) {
            reporter.jasmineDone && reporter.jasmineDone(data);
        });
    }
};
