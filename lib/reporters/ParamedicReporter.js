
function ParamedicReporter() {
    var results = [],
      specsExecuted = 0,
      failureCount = 0,
      pendingSpecCount = 0,
      cordovaInfo = null;

    this.specDone = function(result) {
        if (result.status != "disabled") {
            specsExecuted++;
        }
        if (result.status == "failed") {
              failureCount++;
              results.push(result);
        }
        if (result.status == "pending") {
            pendingSpecCount++;
        }
    };

  this.jasmineDone = function(data) {
      cordovaInfo = data.cordova;
  };

  this.getResults = function() {
      return {
        passed: failureCount === 0,
            mobilespec: {
                specs:specsExecuted,
                failures:failureCount,
                results: results
            },
            platform: cordovaInfo.platform,
            version: cordovaInfo.version,
            model: cordovaInfo.model
        };
    };

    return this;
}

module.exports = ParamedicReporter;
