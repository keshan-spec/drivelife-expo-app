// import { FFmpegKit } from 'ffmpeg-kit-react-native';
// import RNFS from 'react-native-fs';

// const compressVideo = async (videoUri: string, durationSeconds: number, outputUri?: string): Promise<string | null> => {
//     console.log('Compressing video...', outputUri, videoUri);

//     try {
//         // Set the lower bitrate for smaller file size but still maintain quality
//         const bitrate = '2M'; // Reduced bitrate for smaller file size
//         // Clean the URI by removing the 'file://' prefix
//         const cleanUri = videoUri.replace('file://', '');

//         // Output file path for the compressed video
//         const outputPath = `${RNFS.CachesDirectoryPath}/${outputUri || `compressed_${Date.now()}.mp4`}`;

//         // Scaling resolution down to 720p to reduce file size further (adjust based on the original dimensions)
//         const scale = '1920:-2'; // Width 1280, height automatically scaled to maintain aspect ratio

//         // Construct the ffmpeg command to compress the video
//         // const ffmpegCommand = `-i "${cleanUri}" -b:v ${bitrate} -vf "scale=${scale}" -crf 24 -preset faster -c:a aac -b:a 128k "${outputPath}"`;
//         // Adjust CRF (constant rate factor) to improve quality
//         const crf = 18; // Lower CRF means higher quality

//         // Construct the ffmpeg command to compress the video
//         const ffmpegCommand = `-i "${cleanUri}" -b:v ${bitrate} -vf "scale=${scale}" -crf ${crf} -preset medium -c:a aac "${outputPath}"`;


//         // Execute the compression using FFmpegKit
//         const session = await FFmpegKit.execute(ffmpegCommand);

//         // Get the return code and check for success
//         const returnCode = await session.getReturnCode();

//         if (returnCode.isValueSuccess()) {
//             console.log('Video compression successful!', outputPath);
//             return outputPath; // Return the path to the compressed video
//         } else {
//             console.error('Video compression failed with code: ', returnCode);
//             return null;
//         }
//     } catch (error) {
//         console.error('Error while compressing video: ', error);
//         return null;
//     }
// };

// export default compressVideo;
