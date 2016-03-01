var Target = require('./Target');

var START_PORT = 8008;
var END_PORT = 8018;
var TIMEOUT = 10 * 60 * 1000; // 10 minutes in msec - this will become a param

function ParamedicConfig(paramedicConfig) {
    if (typeof paramedicConfig == 'string') {
        // if it string then it is path to config file
        this._config = this.parseFromFile(paramedicConfig);
    } else {
        this._config = this.parseFromArguments(paramedicConfig);
    }
}

ParamedicConfig.prototype.parseFromArguments = function (paramedicArguments) {
    return {
        "targets": [{
            platform: paramedicArguments.platform,
            actions: !!paramedicArguments.justbuild ? 'build' : 'run',
            args: null,
            browserify: !!paramedicArguments.browserify
        }],
        "plugins":   Array.isArray(paramedicArguments.plugin) ? paramedicArguments.plugin : [paramedicArguments.plugin],
        "useTunnel": !!paramedicArguments.tunnel,
        "verbose":   !!paramedicArguments.verbose,
        "startPort": paramedicArguments.startport,
        "endPort":   paramedicArguments.endport,
        "justbuild": paramedicArguments.justbuild,
        "browserify": paramedicArguments.browserify
    }
}

ParamedicConfig.prototype.parseFromFile = function (paramedicConfigPath) {
    return require(paramedicConfigPath);
}

ParamedicConfig.prototype.useTunnel = function () {
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

ParamedicConfig.prototype.isVerbose = function() {
    return this._config.verbose;
};

ParamedicConfig.prototype.isJustBuild = function() {
    return this._config.justbuild;
};

ParamedicConfig.prototype.isBrowserify = function() {
    return this._config.browserify;
};

ParamedicConfig.prototype.getPorts = function() {
    return {
        start: this._config.startPort || START_PORT,
        end: this._config.endPort || END_PORT
    }
};

ParamedicConfig.prototype.getTimeout = function() {
    return TIMEOUT;
}

module.exports = ParamedicConfig;
