var io = cordova.require('cordova-plugin-paramedic.socket.io');

var PARAMEDIC_SERVER_DEFAULT_URL = 'http://127.0.0.1:8008';

function Paramedic() {

}

Paramedic.prototype.initialize = function() {
    var connectionUri = loadParamedicServerUrl();
    this.socket = io.connect(connectionUri);

    this.socket.on('connect', function () {
        console.log("Paramedic has been susccessfully connected to server");
    });

    this.overrideConsole();
    this.injectJasmineReporter();
};


Paramedic.prototype.overrideConsole = function () {

    var origConsole = window.console;
    var me = this;

    function createCustomLogger(type) {
        return function () {
            origConsole[type].apply(origConsole, arguments);

            me.socket.emit('log', { type: type, msg: Array.prototype.slice.apply(arguments) });
        };
    }
    window.console = {
        log: createCustomLogger('log'),
        warn: createCustomLogger('warn'),
        error: createCustomLogger('error'),
    };
    console.log('Paramedic console has been installed.');
};

Paramedic.prototype.injectJasmineReporter = function () {
    var JasmineParamedicProxy = require('cordova-plugin-paramedic.JasmineParamedicProxy');
    var jasmineProxy = new JasmineParamedicProxy(this.socket);
    var testsModule = cordova.require("cordova-plugin-test-framework.cdvtests");
    var defineAutoTestsOriginal = testsModule.defineAutoTests;

    testsModule.defineAutoTests = function () {
        defineAutoTestsOriginal();
        jasmine.getEnv().addReporter(jasmineProxy);
    };
};

new Paramedic().initialize();

function loadParamedicServerUrl() {

    try {
        // attempt to synchronously load medic config
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "../paramedic.json", false);
        xhr.send(null);
        var cfg = JSON.parse(xhr.responseText);

        return cfg.serverUrl || PARAMEDIC_SERVER_DEFAULT_URL;

    } catch (ex) {}

    return PARAMEDIC_SERVER_DEFAULT_URL;
}

module.exports = Paramedic;
