
function Target(config) {
    this.platform = config.platform;
    this.action =  config.action || 'run';
    this.args = config.args || null;
    this.browserify = !!config.browserify;

    this.platformId = this.platform.split("@")[0];
}

module.exports = Target;
