import { withForegroundService } from './configPlugins/withForegroundService';

module.exports = ({ config }) => {
    return {
        ...config,
        plugins: [...config.plugins, [withForegroundService]],
    };
};