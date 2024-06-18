import React, { createContext, useContext, useState } from 'react';
import ImageSize from 'react-native-image-size';
import RNFS from 'react-native-fs';

export const PostContext = createContext();

const fetchImageDataAsBase64 = async (uri, type) => {
    try {
        const data = await RNFS.readFile(uri, 'base64');
        return `data:${type};base64,${data}`;
    } catch (error) {
        console.error(`Error fetching image data for ${uri}:`, error);
        throw error;
    }
};

export const PostProvider = ({ children }) => {
    const [selectedPhotos, setSelectedPhotos] = useState([]);
    const [step, setStep] = useState(0);
    const [taggedEntities, setTaggedEntities] = useState([]);

    const getImageMetaData = async () => {
        let media = [];
        let tallestImg = 0;

        for (let image of selectedPhotos) {
            const { width, height } = await ImageSize.getSize(image.uri);

            if (height > tallestImg) {
                tallestImg = height;
            }

            let type = 'image';

            if (image.type) {
                type = image.type.split('/')[0];
            }

            const base64Data = await fetchImageDataAsBase64(image.uri, image.type);
            media.push({ data: base64Data, type, width, height, alt: image.filename });
        }

        media = media.map((item) => {
            item.height = tallestImg;
            return item;
        });

        return media;
    };

    return (
        <PostContext.Provider value={{ selectedPhotos, setSelectedPhotos, step, setStep, getImageMetaData, taggedEntities, setTaggedEntities }}>
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
