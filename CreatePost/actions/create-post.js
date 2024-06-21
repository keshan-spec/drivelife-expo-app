export const API_URL = 'https://wordpress-889362-4267074.cloudwaysapps.com/uk';
// https://javascript.plainenglish.io/large-file-uploads-in-the-background-with-react-native-1b9fe49e367c

import AWS from 'aws-sdk';
import RNFS from 'react-native-fs';

import { Buffer } from "buffer";

const BUCKET_NAME = 'drivelife-media';

// Initialize AWS SDK
AWS.config.update({
    region: 'eu-west-2', // Replace with your AWS region
    credentials: {
        accessKeyId: 'AKIAZI2LH4GQ2KFIDSGO',
        secretAccessKey: 'tQHk5Z8Pb0sjEInEFQYWbDKTU02iTCObTQtlPc+n',
    },
});

const s3 = new AWS.S3();
const CHUNK_SIZE = 1024 * 1024 * 5; // 1MB

const initiateMultipartUpload = async (fileName, bucketName) => {
    const params = {
        Bucket: bucketName,
        Key: fileName,
        // ACL: 'public-read',
    };
    const response = await s3.createMultipartUpload(params).promise();
    return response.UploadId;
};

const uploadPart = async (bucketName, fileName, uploadId, partNumber, chunkData) => {
    const params = {
        Bucket: bucketName,
        Key: fileName,
        PartNumber: partNumber,
        UploadId: uploadId,
        Body: chunkData,
    };
    const response = await s3.uploadPart(params).promise();
    return response.ETag;
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

export const uploadFileInChunks = async (user_id, mediaList) => {
    try {
        const uploadedData = [];

        for (let i = 0; i < mediaList.length; i++) {
            const currentFile = mediaList[i];
            console.log(currentFile);
            const fileSize = currentFile.fileSize;
            const filePath = currentFile.uri;
            const fileName = currentFile.filename;
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
                console.log(`Uploading file ${i + 1}/${mediaList.length}: ${percentage}% completed`);

                // Increment the offset and part number
                offset += currentChunkSize;
                partNumber += 1;
            }

            // Complete the multipart upload
            const response = await completeMultipartUpload(BUCKET_NAME, fileName, uploadId, parts);
            const { Location, Key } = response;

            uploadedData.push({
                url: Location,
                key: Key,
                mime: currentFile.type,
                type: currentFile.type.includes('image') ? 'image' : 'video',
                width: currentFile.width,
                height: currentFile.height,
            });

            console.log(`File ${i + 1}/${mediaList.length} upload complete`);
        }

        return uploadedData;
    } catch (error) {
        console.error('Error during chunk upload:', error);
    }
};

export const addPost = async (user_id, mediaList, caption = '', location = '') => {
    try {
        if (!user_id || !mediaList || mediaList.length === 0) {
            throw new Error("Invalid data");
        }

        const media = await uploadFileInChunks(user_id, mediaList);

        const formData = new FormData();
        formData.append("user_id", user_id);
        formData.append("caption", caption || "");
        formData.append("location", location || "");
        formData.append("media", JSON.stringify(media));

        const response = await fetch(`${API_URL}/wp-json/app/v1/create-post`, {
            cache: "no-cache",
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        if (!data || data.error) {
            throw new Error(data.error);
        }

        if (response.status !== 200) {
            throw new Error("Failed to create post");
        }

        return data;
    } catch (e) {
        console.log(e.message);
        throw new Error("Failed to create post");
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

export const fetchTaggableEntites = async (user_id, search, tagged_entities, is_vehicle) => {
    const url = is_vehicle ? `${API_URL}/wp-json/app/v1/get-taggable-vehicles` : `${API_URL}/wp-json/app/v1/get-taggable-entities`;

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