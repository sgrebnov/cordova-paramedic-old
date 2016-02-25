var Target = require('./Target');

function ParamedicConfig(paramedicConfigPath) {
    this.parsedConfig = require(paramedicConfigPath);

    this.getTargets = function () {
        return this.parsedConfig.targets.map(function(target) {
            return new Target(target);
        });
    }

    this.getPlugins = function () {
        return this.parsedConfig.plugins;
    }

    this.getExternalServerUrl= function () {
        return this.parsedConfig.externalServerUrl;
    }
}

module.exports = ParamedicConfig;