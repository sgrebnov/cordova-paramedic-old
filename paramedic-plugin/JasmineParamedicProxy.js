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
    this.socket.emit('jasmineDone', o);
};

module.exports = JasmineParamedicProxy;
