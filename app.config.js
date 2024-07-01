import { withForegroundService } from './configPlugins/withForegroundService';
import 'dotenv/config';

module.exports = ({ config }) => {
    return {
        ...config,
        plugins: [...config.plugins, [withForegroundService]],
        extra: {
            ...config.extra,
            awsRegion: process.env.AWS_REGION || 'eu-west-2',
            awsBucketName: process.env.AWS_BUCKET_NAME,
            awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
            awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    };
};