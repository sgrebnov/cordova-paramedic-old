var Target = require('./Target');

function ParamedicConfig(paramedicConfigPath) {
    this._config = require(paramedicConfigPath);
}

ParamedicConfig.prototype.useTunnel = function() {
    return this._config.useTunnel;
};

ParamedicConfig.prototype.getTargets = function () {
    return this._config.targets.map(function(target) {
        return new Target(target);
    });
};

ParamedicConfig.prototype.getPlugins = function () {
    return this._config.plugins;
};


ParamedicConfig.prototype.getExternalServerUrl= function () {
    return this._config.externalServerUrl;
};

module.exports = ParamedicConfig;
