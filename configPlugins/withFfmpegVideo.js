const { withProjectBuildGradle } = require('@expo/config-plugins');

const withFFmpegKitGradle = (config) => {
    config = withProjectBuildGradle(config, (config) => {

        // add ffmpegKitPackage = "video" to the build.gradle file ext block
        // in android/build.gradle
        config.modResults.contents = config.modResults.contents.replace(
            `ext {`,
            `ext {\n    ffmpegKitPackage = "video"`
        );

        return config;
    });

    return config;
};

module.exports = { withFFmpegKitGradle };
