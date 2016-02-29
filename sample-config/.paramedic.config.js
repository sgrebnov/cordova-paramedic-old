module.exports = {
    "externalServerUrl": "http://10.0.8.254",
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
        },
        {    // WP 8.1 Device(arm)
            "platform": "windows@https://github.com/apache/cordova-windows.git",
            "action": "run",
            "args": "--archs=arm --device -- --phone"
        }
    ]
}
