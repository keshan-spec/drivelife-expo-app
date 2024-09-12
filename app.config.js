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
            headlessAPIUrl: process.env.HEADLESS_API_URL || 'https://www.carevents.com/uk',
            cloudflareApiToken: process.env.CLOUDFARE_API_KEY,
            cloudflareAccountId: process.env.CLOUDFARE_ACCOUNT_ID,
        }
    };
};