var ConsoleReporter = require('./reporters/ConsoleReporter');
var ParamedicReporter = require('./reporters/ParamedicReporter');

module.exports = {
    // default reporter which is used to determine whether tests pass or not
    paramedicReporter: null,
    // all reporters including additional reporters to trace results to console, etc
    reporters: [],
    reset: function() {
        paramedicReporter = new ParamedicReporter();
        // default paramedic reporter
        reporters = [paramedicReporter];
        // extra reporters
        reporters.push(new ConsoleReporter({print: process.stdout.write, showColors: true}));
    },
    initialize: function()
    {
        reset();
    },
    getResults: function() {
        return paramedicReporter.getResults();
    },
    jasmineStarted: function(data) {
        reporters.forEach(function (reporter) {
            reporter.jasmineStarted && reporter.jasmineStarted(data);
        })
    },
    specStarted: function(data) {
        reporters.forEach(function (reporter) {
            reporter.specStarted && reporter.specStarted(data);
        })
    },
    specDone: function(data) {
        reporters.forEach(function (reporter) {
            reporter.specDone && reporter.specDone(data);
        })
    },
    suiteStarted: function(data) {
        reporters.forEach(function (reporter) {
            reporter.suiteStarted && reporter.suiteStarted(data);
        })
    },
    suiteDone: function(data) {
        reporters.forEach(function (reporter) {
            reporter.suiteDone && reporter.suiteDone(data);
        })
    },
    jasmineDone: function(data) {
        reporters.forEach(function (reporter) {
            reporter.jasmineDone && reporter.jasmineDone(data);
        })
    }
};
