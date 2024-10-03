import { FFmpegKit } from 'ffmpeg-kit-react-native';
import RNFS from 'react-native-fs';

const compressVideo = async (videoUri: string, durationSeconds: number, outputUri?: string): Promise<string | null> => {
    console.log('Compressing video...', outputUri, videoUri);

    try {
        // Set the lower bitrate for smaller file size but still maintain quality
        const bitrate = '5M'; // Reduced bitrate for smaller file size
        // Clean the URI by removing the 'file://' prefix
        const cleanUri = videoUri;

        // Output file path for the compressed video
        const outputPath = `${RNFS.CachesDirectoryPath}/${outputUri || `compressed_${Date.now()}.mov`}`;
        const scale = '2560:-2'; // Width 1280, height automatically scaled to maintain aspect ratio

        // Adjust CRF (constant rate factor) to improve quality
        const crf = 12; // Lower CRF means higher quality

        // Construct the ffmpeg command to compress the video
        const ffmpegCommand = `-i "${cleanUri}" -b:v ${bitrate} -vf "scale=${scale}" -crf ${crf} -c:a aac "${outputPath}"`;
        // const ffmpegCommand = `-i "${cleanUri}" -c:v h264_videotoolbox -b:v 3000k -c:a aac -vf "scale=${scale}" "${outputPath}"`;
        // Execute the compression using FFmpegKit
        const session = await FFmpegKit.execute(ffmpegCommand);

        // Get the return code and check for success
        const returnCode = await session.getReturnCode();

        if (returnCode.isValueSuccess()) {
            console.log('Video compression successful!', outputPath);
            return outputPath; // Return the path to the compressed video
        } else {
            console.error('Video compression failed with code: ', returnCode);
            return null;
        }
    } catch (error) {
        console.error('Error while compressing video: ', error);
        return null;
    }
};

export default compressVideo;