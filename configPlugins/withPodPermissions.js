const { withPodfileProperties } = require('@expo/config-plugins');

const withPodPermissions = (config) => {
    config = withPodfileProperties(config, (config) => {
        config.modResults = config.modResults.replace(
            /target 'app' do/g,
            `target 'app' do
    permissions_path = '../node_modules/react-native-permissions/ios'
        `);

        return config;
    });

    return config;
};

module.exports = { withPodPermissions };
