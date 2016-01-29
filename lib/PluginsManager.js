var shell = require('shelljs');
var path = require('path');
var fs = require('fs');
var logger = require('./logger').get();
var PluginInfoProvider = require('cordova-common').PluginInfoProvider;

function PluginsManager(appRoot) {
    this.appRoot = appRoot;
}

PluginsManager.prototype.installPlugins = function(plugins) {
    for(var n = 0; n < plugins.length; n++) {
        var plugin = plugins[n];
        this.installSinglePlugin(plugin);
    }
};

PluginsManager.prototype.installTestsForExistingPlugins = function() {
    var installedPlugins = new PluginInfoProvider().getAllWithinSearchPath(path.join(this.appRoot, 'plugins'));
    var me = this;
    installedPlugins.forEach(function(plugin) {
        // there is test plugin available
        if (fs.existsSync(path.join(plugin.dir, 'tests', 'plugin.xml'))) {
            me.installSinglePlugin(path.join(plugin.dir, 'tests'));
        }
    });
};

PluginsManager.prototype.installSinglePlugin = function(plugin) {
    logger.log("cordova-paramedic: installing " + plugin);
    // var pluginPath = path.resolve(this.storedCWD, plugin);
    var plugAddCmd = shell.exec('cordova plugin add ' + plugin, {silent:!this.verbose});
    if(plugAddCmd.code !== 0) {
        logger.error('Failed to install plugin : ' + plugin);
        throw new Error('Failed to install plugin : ' + plugin);
    }
};

module.exports = PluginsManager;
