module.exports = {
    //"externalServerUrl": "http://10.0.8.254",
    "useTunnel": true,
    "plugins": [
        "https://github.com/apache/cordova-plugin-battery-status",
        "https://github.com/apache/cordova-plugin-camera",
        "https://github.com/apache/cordova-plugin-console",
        "https://github.com/apache/cordova-plugin-contacts",
        "https://github.com/apache/cordova-plugin-device",
        "https://github.com/apache/cordova-plugin-device-motion",
        "https://github.com/apache/cordova-plugin-device-orientation",
        "https://github.com/apache/cordova-plugin-dialogs",
        "https://github.com/apache/cordova-plugin-file",
        "https://github.com/apache/cordova-plugin-file-transfer",
        "https://github.com/apache/cordova-plugin-geolocation",
        "https://github.com/apache/cordova-plugin-globalization",
        "https://github.com/apache/cordova-plugin-inappbrowser",
        "https://github.com/apache/cordova-plugin-media",
        "https://github.com/apache/cordova-plugin-media-capture",
        "https://github.com/apache/cordova-plugin-network-information",
        "https://github.com/apache/cordova-plugin-splashscreen",
        "https://github.com/apache/cordova-plugin-statusbar",
        "https://github.com/apache/cordova-plugin-vibration"
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
        },
        {    // WP 8.1 Device(arm)
            "platform": "windows@https://github.com/apache/cordova-windows.git",
            "action": "run",
            "args": "--archs=arm --device -- --phone"
        }
    ]
}
