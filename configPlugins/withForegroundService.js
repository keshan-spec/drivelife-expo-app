const { AndroidConfig, withAndroidManifest } = require('@expo/config-plugins');

const withForegroundService = (config) => {
    config = withAndroidManifest(config, async (config) => {
        const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

        // <service android:name="com.asterinet.react.bgactions.RNBackgroundActionsTask" android:foregroundServiceType="dataSync" />
        // add the service to the AndroidManifest.xml
        AndroidConfig.Manifest.addMetaDataItemToMainApplication(mainApplication, 'android:foregroundServiceType', 'dataSync');

        // Add services
        const service = {
            $: {
                'android:name': 'com.asterinet.react.bgactions.RNBackgroundActionsTask',
                'android:foregroundServiceType': 'dataSync',
            },
        };

        mainApplication.service = mainApplication.service || [];
        mainApplication.service.push(service);

        return config;
    });

    return config;
};

module.exports = { withForegroundService };
