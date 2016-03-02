cordova-paramedic
=================

[![Build Status](https://travis-ci.org/purplecabbage/cordova-paramedic.svg?branch=master)](https://travis-ci.org/purplecabbage/cordova-paramedic)

Runs cordova medic/buildbot tests locally.

... provides advanced levels of care at the point of illness or injury, including out of hospital treatment, and diagnostic services

# To install :
``` $npm install cordova-paramedic ```

## Supported Cordova Platforms

- Android
- iOS
- Windows Phone 8
- Windows (Windows 8.1, Windows Phone 8.1, Windows 10 Tablet/PC)
- Browser

# Usage

Paramedic parameters could be passed via command line arguments or via separate configuration file:

```
cordova-paramedic --platform PLATFORM --plugin PATH <other parameters>
cordova-paramedic --config ./sample-config/.paramedic.config.js
```

## Command Line Interface

####`--platform` (required)

Specifies target cordova platform (could refer to local directory, npm or git)

```
cordova-paramedic --platform ios --plugin cordova-plugin-inappbrowser
cordova-paramedic --platform ios@4.0 --plugin cordova-plugin-inappbrowser
cordova-paramedic --platform ios@../cordova-ios --plugin cordova-plugin-inappbrowser
cordova-paramedic --platform ios@https://github.com/apache/cordova-ios.git#4.1.0 --plugin cordova-plugin-inappbrowser
```

####`--plugin` (required)

Specifies test plugin, you may specify multiple --plugin flags and they will all be installed and tested together. Similat to `platform` parameter you can refer to local (or absolute) path, npm registry or git repo.

```
cordova-paramedic --platform ios --plugin cordova-plugin-inappbrowser
cordova-paramedic --platform ios --plugin ../cordova-plugin-inappbrowser
cordova-paramedic --platform ios --plugin https://github.com/apache/cordova-plugin-inappbrowser
// several plugins
cordova-paramedic --platform ios --plugin cordova-plugin-inappbrowser --plugin cordova-plugin-contacts
```
####--justbuild (optional)

Just builds the project, without running the tests.

```
cordova-paramedic --platform ios --plugin cordova-plugin-inappbrowser --justbuild
```

####--device (optional)

Tests must be run on connected device instead of emulator.

```
cordova-paramedic --platform ios --plugin cordova-plugin-inappbrowser --device
```

####--externalServerUrl (optional)

Useful when testing on real device (`--device` parameter) so that tests results from device could be posted back to paramedic server.

```
cordova-paramedic --platform ios --plugin cordova-plugin-inappbrowser --externalServerUrl http://10.0.8.254
```

####--useTunnel (optional)

Use [tunneling](https://www.npmjs.com/package/localtunnel) instead of local address (default is false).
Useful when testing on real devices and don't want to specify external ip address (see `--externalServerUrl` above) of paramedic server.

```
cordova-paramedic --platform ios --plugin cordova-plugin-inappbrowser --useTunnel
```

####--browserify (optional)

Plugins are browserified into cordova.js.

```
cordova-paramedic --platform ios --plugin cordova-plugin-inappbrowser --browserify
```

####--port (optional)

Port to use for posting results from emulator back to paramedic server (default is from `8008`). You can also specify a range using `--startport` and `endport` and paramedic will select the first available.

```
cordova-paramedic --platform ios --plugin cordova-plugin-inappbrowser --port 8010
cordova-paramedic --platform ios --plugin cordova-plugin-inappbrowser --startport 8000 endport 8020
```

####--verbose (optional)

Verbose mode. Display more information output

```
cordova-paramedic --platform ios --plugin cordova-plugin-inappbrowser --verbose
```

####--timeout (optional)

Time in millisecs to wait for tests to pass|fail (defaults to 10 minutes). 

```
cordova-paramedic --platform ios --plugin cordova-plugin-inappbrowser --timeout 30000
```

## Paramedic configuration file

Configuration file is used when no parameters are passed to `cordova-paramedic` call or explicitly specified via `--config` parameter:
```
cordova-paramedic  <- paramedic will attempt to find .paramedic.config.js in working directory
cordova-paramedic --config ./sample-config/.paramedic.config.js
```
Example configuration file is showed below. It supports similar arguments and has the following advantages over `Command Line Approach`:

-   Supports extra arguments which could be passed to cordova so that you have full control over build and run target.
-   Supports several test platforms (targets) to be executed as single paramedic run (results will be aggregated) so you don't need to re-install test plugins, create local server and do other steps several times.

```
module.exports = {
    // "externalServerUrl": "http://10.0.8.254",
    "useTunnel": true,
    "plugins": [
        "https://github.com/apache/cordova-plugin-inappbrowser"
    ],
    "targets": [
        {
            "platform": "ios@https://github.com/apache/cordova-ios.git",
            "action": "run",
             "args": "--device"
        },
        {
            "platform": "android@https://github.com/apache/cordova-android.git",
            "action": "run",
             "args": "--device"
        },
        {    // Windows 8.1 Desktop(anycpu)
            "platform": "windows@https://github.com/apache/cordova-windows.git",
            "action": "run"
        },
        {   // Windows 10 Desktop(x64)
            "platform": "windows@https://github.com/apache/cordova-windows.git",
            "action": "run",
            "args": "--archs=x64 -- --appx=uap"
        }
    ]
}
```
More configuration file examples could be found in `sample-config` folder.

## API Interface

You can also use cordova-paramedic as a module directly :

```
  var paramedic = require('cordova-paramedic');
  paramedic.run(config);
```


