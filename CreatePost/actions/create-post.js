
import AWS from 'aws-sdk';
import RNFS from 'react-native-fs';
import uuid from 'react-native-uuid';
import BackgroundService from 'react-native-background-actions';
import { getImageMetaData, getVideoMetaData, Image, Video } from 'react-native-compressor';
import RNVideoHelper from 'react-native-video-helper';

import { Buffer } from "buffer";
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import compressVideo from './compress-video';

const API_URL = Constants.expoConfig.extra.headlessAPIUrl;
const BUCKET_NAME = Constants.expoConfig.extra.awsBucketName;
const MIN_COMPRESSION_SIZE = 1024 * 1024 * 20; // 20MB

const CLOUDFARE_ACCOUNT_ID = Constants.expoConfig.extra.cloudflareAccountId;
const CLOUDFARE_API_TOKEN = Constants.expoConfig.extra.cloudflareApiToken;

AWS.config.update({
    region: Constants.expoConfig.extra.awsRegion,
    credentials: {
        accessKeyId: Constants.expoConfig.extra.awsAccessKeyId,
        secretAccessKey: Constants.expoConfig.extra.awsSecretAccessKey,
    },
});

const s3 = new AWS.S3();
const CHUNK_SIZE = 1024 * 1024 * 5; // 5MB

const initiateMultipartUpload = async (fileName, bucketName) => {
    try {
        const params = {
            Bucket: bucketName,
            Key: fileName,
            // ACL: 'public-read',
        };
        const response = await s3.createMultipartUpload(params).promise();
        return response.UploadId;
    } catch (error) {
        console.error('Error during multipart upload initiation:', error);
        throw error;
    }
};

const uploadPart = async (bucketName, fileName, uploadId, partNumber, chunkData) => {
    try {
        const params = {
            Bucket: bucketName,
            Key: fileName,
            PartNumber: partNumber,
            UploadId: uploadId,
            Body: chunkData,
        };
        const response = await s3.uploadPart(params).promise();
        return response.ETag;
    } catch (error) {
        console.error('Error during part upload:', error);
        throw error;
    }
};

const completeMultipartUpload = async (bucketName, fileName, uploadId, parts) => {
    const params = {
        Bucket: bucketName,
        Key: fileName,
        UploadId: uploadId,
        MultipartUpload: {
            Parts: parts,
        },
    };

    const response = await s3.completeMultipartUpload(params).promise();
    return response;
};

const compressMedia = async (media, type) => {
    const fileName = uuid.v4(); // Encode URI to handle spaces and special characters
    const encodedUri = media.uri;
    const fileExtension = media.uri.split('.').pop();

    try {
        switch (type) {
            case 'image':
                const compressedImage = await Image.compress(encodedUri, {
                    quality: 1,
                });

                const {
                    ImageHeight,
                    ImageWidth,
                    size: imageSize,
                    extension: imageExtension
                } = await getImageMetaData(compressedImage);

                return {
                    uri: compressedImage,
                    height: ImageHeight,
                    width: ImageWidth,
                    fileSize: imageSize,
                    filename: `${fileName}.${imageExtension}`,
                };
            case 'video':
                // if video is less than 20MB, don't compress
                const videoSize = await RNFS.stat(encodedUri);

                if (videoSize.size < MIN_COMPRESSION_SIZE) {
                    const {
                        height,
                        width,
                        extension
                    } = await getVideoMetaData(encodedUri);

                    return {
                        uri: encodedUri,
                        height,
                        width,
                        fileSize: videoSize.size,
                        filename: `${fileName}.${extension}`,
                    };
                }

                // const compressedVideo = await Video.compress(encodedUri, {
                //     quality: 1,
                //     compressionMethod: 'manual',
                //     bitrate: 10 * 1000 * 1000,
                // });
                const compressedVideo = await compressVideo(encodedUri, media.duration, `${fileName}.${fileExtension}`);
                if (!compressedVideo) {
                    throw new Error('Failed to compress video');
                }

                const {
                    size,
                    height,
                    width,
                    extension
                } = await getVideoMetaData(compressedVideo);

                return {
                    uri: `file://${compressedVideo}`,
                    height,
                    width,
                    fileSize: size,
                    filename: `${fileName}.${extension}`
                };
            default:
                return null;
        }
    } catch (error) {
        console.error('Error during media compression:', error);
        throw error;
    }
};

const uploadFileInChunks = async (user_id, mediaList) => {
    try {
        const uploadedData = [];
        let completeStatusPercent = 0;

        for (let i = 0; i < mediaList.length; i++) {
            const type = mediaList[i].type.split('/')[0];
            const mime = mediaList[i].type;
            const currentFile = await compressMedia(mediaList[i], type);

            if (!currentFile) {
                throw new Error('Failed to compress media');
            }

            const fileSize = currentFile.fileSize;
            const filePath = currentFile.uri;
            const fileName = `${user_id}/${currentFile.filename}`;

            let offset = 0;
            let partNumber = 1;
            let parts = [];

            // Initiate the multipart upload
            const uploadId = await initiateMultipartUpload(fileName, BUCKET_NAME);

            while (offset < fileSize) {
                // Calculate remaining size
                const remainingSize = fileSize - offset;
                const currentChunkSize = Math.min(CHUNK_SIZE, remainingSize);

                // Read a chunk of the file
                const chunk = await RNFS.read(filePath, currentChunkSize, offset, 'base64');
                const chunkData = Buffer.from(chunk, 'base64');

                // Upload the chunk to S3
                const eTag = await uploadPart(BUCKET_NAME, fileName, uploadId, partNumber, chunkData);
                parts.push({ PartNumber: partNumber, ETag: eTag });

                // Calculate and log progress
                let percentage = Math.round((offset / fileSize) * 100);
                completeStatusPercent = Math.round(percentage / mediaList.length);

                await BackgroundService.updateNotification({
                    progressBar: {
                        max: 100,
                        value: completeStatusPercent,
                    },
                    taskDesc: `Uploading ${completeStatusPercent}% completed`,
                });

                console.log(`Uploading file ${i + 1}/${mediaList.length}: ${percentage}% completed`);

                // Increment the offset and part number
                offset += currentChunkSize;
                partNumber += 1;
            }

            // Complete the multipart upload
            const response = await completeMultipartUpload(BUCKET_NAME, fileName, uploadId, parts);
            const { Key } = response;

            uploadedData.push({
                url: `https://d3gv6k8qu6wcqs.cloudfront.net/${Key}`,
                key: Key,
                mime,
                type: type,
                width: currentFile.width,
                height: currentFile.height,
            });

            completeStatusPercent = Math.round(uploadedData.length / mediaList.length * 100);

            await BackgroundService.updateNotification({
                progressBar: {
                    max: 100,
                    value: completeStatusPercent,
                },
                taskDesc: `Uploading ${completeStatusPercent}% completed`,
            });

            console.log(`File ${i + 1}/${mediaList.length} upload complete`);
        }

        await BackgroundService.updateNotification({
            taskDesc: 'Uploaded media files',
        });
        return uploadedData;
    } catch (error) {
        await BackgroundService.stop();
        console.error('Error during chunk upload:', error);
        throw error;
    }
};

const uploadFilesToCloudflare = async (mediaList) => {
    const CLOUDFLARE_ACCOUNT_ID = Constants.expoConfig.extra.cloudflareAccountId;
    const CLOUDFLARE_API_TOKEN = Constants.expoConfig.extra.cloudflareApiToken;

    const CLOUDFLARE_UPLOAD_URL = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`;
    const CLOUDFLARE_STREAM_URL = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`;

    try {
        const uploadedData = [];
        let completeStatusPercent = 0;

        for (let i = 0; i < mediaList.length; i++) {
            const file = mediaList[i];

            const type = file.type.split('/')[0];
            const mime = file.type;

            // Compress file if needed
            const currentFile = await compressMedia(file, type);
            if (!currentFile) {
                throw new Error('Failed to compress media');
            }

            const filePath = currentFile.uri;
            const fileName = currentFile.filename;
            const fileSize = currentFile.fileSize;

            let formData;
            let uploadUrl = '';

            if (type === 'image') {
                // Read the file as base64 for image uploads
                const fileData = await RNFS.readFile(filePath, 'base64');
                formData = new FormData();
                formData.append('file', {
                    uri: `data:${mime};base64,${fileData}`,
                    name: fileName,
                    type: mime
                });
                uploadUrl = CLOUDFLARE_UPLOAD_URL;
            } else if (type === 'video') {
                formData = new FormData();
                formData.append('file', {
                    uri: filePath,
                    name: fileName,
                    type: mime
                });
                uploadUrl = CLOUDFLARE_STREAM_URL;
            }

            // Upload the file
            const request = await fetch(uploadUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            const response = await request.json();

            if (!response || response.success !== true) {
                throw new Error(response.errors ? response.errors[0].message : 'Failed to upload file to Cloudflare');
            }

            if (response.success === true) {
                let mediaId = '';

                if (type === 'image') {
                    const { id } = response.result;
                    mediaId = id;
                } else if (type === 'video') {
                    const { uid } = response.result;
                    mediaId = uid;
                }

                uploadedData.push({
                    url: mediaId,
                    mime,
                    type,
                    width: currentFile.width,
                    height: currentFile.height,
                    server: 'cloudflare'
                });
            }

            // Update progress
            completeStatusPercent = Math.round(((i + 1) / mediaList.length) * 100);
            console.log(`File ${i + 1}/${mediaList.length} upload complete: ${completeStatusPercent}%`);


            await BackgroundService.updateNotification({
                progressBar: {
                    max: 100,
                    value: completeStatusPercent,
                },
                taskTitle: 'Uploading media files',
                taskDesc: `Uploading ${completeStatusPercent}% completed`,
            });
        }

        return uploadedData;
    } catch (error) {
        console.error('Error uploading files to Cloudflare:', error);
        throw error;
    }
};

export const addPost = async ({
    user_id,
    mediaList,
    caption,
    location,
    taggedEntities = [],
    association_id,
    association_type,
    onUpload = () => { }
}) => {
    try {
        if (!user_id || !mediaList || mediaList.length === 0) {
            await BackgroundService.stop();
            throw new Error("Invalid data");
        }

        // const media = await uploadFileInChunks(user_id, mediaList);
        const media = await uploadFilesToCloudflare(mediaList);
        const formData = new FormData();

        formData.append("user_id", user_id);
        formData.append("caption", caption || "");
        formData.append("location", location || "");
        formData.append("media", JSON.stringify(media));

        if (association_id && association_type) {
            formData.append("association_id", association_id);
            formData.append("association_type", association_type);
        }

        const response = await fetch(`${API_URL}/wp-json/app/v1/create-post`, {
            cache: "no-cache",
            method: "POST",
            body: formData,
        });

        // iOS will also run everything here in the background until .stop() is called
        await BackgroundService.stop();

        const data = await response.json();
        if (!data || data.error || response.status !== 200) {
            await addNotification("Failed to create post", data.error || "Failed to create post");
            throw new Error(data.error || "Post creation failed, status: " + response.status);
        }

        if (taggedEntities.length > 0) {
            const tag_response = await addTagsForPost(user_id, data.post_id, taggedEntities);
        }

        onUpload();
        await addNotification("Post created", "Post created successfully", {
            post_id: data.post_id,
        });

        return data;
    } catch (e) {
        console.log("Error creating post", e);

        await addNotification("Failed to create post", e.message || "Failed to create post");
        await BackgroundService.stop();
        throw new Error(`Failed to create post: ${e.message}`);
    }
};

export const addTagsForPost = async (user_id, postId, tags) => {
    try {
        if (!user_id || !postId || !tags || tags.length === 0) {
            throw new Error("Invalid data");
        }

        const response = await fetch(`${API_URL}/wp-json/app/v1/add-tags`, {
            cache: "no-cache",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_id, post_id: postId, tags }),
        });

        const data = await response.json();
        if (!response.ok || response.status !== 200) {
            throw new Error(data.message);
        }

        return data;
    } catch (e) {
        console.error("Error adding tags", e.message);
        return null;
    }
};

export const fetchTaggableEntites = async (user_id, search, tagged_entities, entity_type) => {
    let url;
    switch (entity_type) {
        case 'car':
            url = `${API_URL}/wp-json/app/v1/get-taggable-vehicles`;
            break;
        case 'events':
            url = `${API_URL}/wp-json/app/v1/get-taggable-events`;
            break;
        case 'users':
            url = `${API_URL}/wp-json/app/v1/get-taggable-entities`;
            break;
        default:
            url = `${API_URL}/wp-json/app/v1/get-taggable-entities`;
            break;
    }

    // const url = is_vehicle ? `${API_URL}/wp-json/app/v1/get-taggable-vehicles` : `${API_URL}/wp-json/app/v1/get-taggable-entities`;
    try {
        const response = await fetch(url, {
            cache: "no-cache",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ search, user_id, tagged_entities }),
        });

        const data = await response.json();
        if (!response.ok || response.status !== 200) {
            throw new Error(data.message);
        }

        return data;
    } catch (e) {
        return [];
    }
};

const addNotification = async (title, message, data = null) => {
    // add a notification to the user
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body: message,
            data: data,
        },
        trigger: null,
        identifier: 'primary',
    });
};