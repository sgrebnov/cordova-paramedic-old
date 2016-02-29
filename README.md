cordova-paramedic
=================

[![Build Status](https://travis-ci.org/purplecabbage/cordova-paramedic.svg?branch=master)](https://travis-ci.org/purplecabbage/cordova-paramedic)

Runs cordova medic/buildbot tests locally.

... provides advanced levels of care at the point of illness or injury, including out of hospital treatment, and diagnostic services

To install :
``` $npm install cordova-paramedic ```

Usage :

```
cordova-paramedic --platform PLATFORM --plugin PATH [--justbuild --timeout MSECS --startport PORTNUM --endport PORTNUM --browserify --verbose ]
`PLATFORM` : the platform id. Currently supports "ios", "browser", "windows", "android", "wp8". 
	Path to platform can be specified as link to git repo like: 
	`windows@https://github.com/apache/cordova-windows.git`
	or path to local copied git repo like: 
	`windows@../cordova-windows/`
`PATH` : the relative or absolute path to a plugin folder
	expected to have a 'tests' folder.
	You may specify multiple --plugin flags and they will all
	be installed and tested together.
`MSECS` : (optional) time in millisecs to wait for tests to pass|fail 
	(defaults to 10 minutes) 
`PORTNUM` : (optional) ports to find available and use for posting results from emulator back to paramedic server(default is from 8008 to 8009)
--justbuild : (optional) just builds the project, without running the tests 
--browserify : (optional) plugins are browserified into cordova.js 
--verbose : (optional) verbose mode. Display more information output

```

Input options can be specified in config file. To use it specify path in "config" parameter like this:

```
cordova-paramedic --config .paramedic.config.js
```

If paramedic launched without params it will use ".paramedic.config.js" from start folder by default.
Example configs given in sample-config folder

You can also use cordova-paramedic as a module directly :

```
  var paramedic = require('cordova-paramedic');
  paramedic.run('ios', '../cordova-plugin-device', onCompleteCallback,justBuild,portNum,msTimeout, useBrowserify, beSilent, beVerbose);
```


