function JasmineParamedicProxy(socket) {
    this.socket = socket;
    //jasmineRequire.JsApiReporter.apply(this, arguments);
}

// JasmineParamedicProxy.prototype = jasmineRequire.JsApiReporter.prototype;
// JasmineParamedicProxy.prototype.constructor = JasmineParamedicProxy;

JasmineParamedicProxy.prototype.jasmineStarted = function (o) {
    this.socket.emit('jasmineStarted', o);
};

JasmineParamedicProxy.prototype.specStarted = function (o) {
    this.socket.emit('specStarted', o);
};

JasmineParamedicProxy.prototype.specDone = function (o) {
    this.socket.emit('specDone', o);
};

JasmineParamedicProxy.prototype.suiteStarted = function (o) {
    this.socket.emit('suiteStarted', o);
};

JasmineParamedicProxy.prototype.suiteDone = function (o) {
    this.socket.emit('suiteDone', o);
};

JasmineParamedicProxy.prototype.jasmineDone = function (o) {
    var p = 'Desktop';
    var devmodel='none';
    var version = cordova.version;
    if(typeof device != 'undefined') {
        p = device.platform.toLowerCase();
        devmodel=device.model || device.name;
        version = device.version.toLowerCase();
    }

    o = o || {};

    // include platform info
    o.cordova = {
        platform:(platformMap.hasOwnProperty(p) ? platformMap[p] : p),
        version:version,
        model:devmodel
    }

    this.socket.emit('jasmineDone', o);
};

var platformMap = {
    'ipod touch':'ios',
    'iphone':'ios'
};

module.exports = JasmineParamedicProxy;
