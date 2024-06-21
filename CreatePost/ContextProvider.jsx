import React, { createContext, useContext, useEffect, useState } from 'react';
import ImageSize from 'react-native-image-size';
import RNFS from 'react-native-fs';

export const PostContext = createContext();

const fetchImageDataAsBase64 = async (uri, type) => {
    try {
        const { isFile, size } = await RNFS.stat(uri);

        if (!isFile) {
            throw new Error('File not found:', uri);
        }

        // Define the chunk size
        const chunkSize = 1024 * 1024; // 1MB
        let position = 0;
        let base64Data = '';

        // Read the file in chunks
        while (position < size) {
            const length = Math.min(chunkSize, size - position);
            const chunk = await RNFS.read(uri, length, position, 'base64');

            base64Data += chunk;
            position += length;
        }

        return `data:${type};base64,${base64Data}`;
    } catch (error) {
        console.error(`Error fetching image data for ${uri}:`, error);
        throw error;
    }
};

export const PostProvider = ({ children }) => {
    const [selectedPhotos, setSelectedPhotos] = useState([]);
    const [step, setStep] = useState(0);
    const [taggedEntities, setTaggedEntities] = useState([]);

    useEffect(() => {
        if (step === 0) {
        }
    }, [step]);

    const updateSelectedImage = (index, image) => {
        const updatedImages = [...selectedPhotos];
        updatedImages[index] = image;
        setSelectedPhotos(updatedImages);
    };

    const getImageMetaData = async () => {
        let media = [];
        let tallestImg = 0;

        for (let image of selectedPhotos) {
            let imageWidth = image.width;
            let imageHeight = image.height;

            const { width, height } = await ImageSize.getSize(image.uri);

            if (!imageWidth) {
                imageWidth = width;
            }

            if (!imageHeight) {
                imageHeight = height;
            }

            if (height > tallestImg) {
                tallestImg = height;
            }

            let type = 'image';

            if (image.type) {
                type = image.type.split('/')[0];
            }

            // const base64Data = await fetchImageDataAsBase64(image.uri, image.type);
            media.push({
                ...image,
                width,
                height
            });
        }

        media = media.map((item) => {
            item.height = tallestImg;
            return item;
        });

        return media;
    };

    return (
        <PostContext.Provider value={{ selectedPhotos, setSelectedPhotos, step, setStep, updateSelectedImage, getImageMetaData, taggedEntities, setTaggedEntities }}>
            {children}
        </PostContext.Provider>
    );
};

export const usePostProvider = () => {
    const context = useContext(PostContext);
    if (!context) {
        throw new Error('usePostProvider must be used within a PostProvider');
    }

    return context;
};
