import React, { createContext, useContext, useEffect, useState } from 'react';
import ImageSize from 'react-native-image-size';

export const PostContext = createContext();

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
            let imageWidth = parseFloat(image.width || 0);
            let imageHeight = parseFloat(image.height || 0);

            const { width, height } = await ImageSize.getSize(image.uri);

            if (!imageWidth || imageWidth < 100) {
                imageWidth = width;
            }

            if (!imageHeight || imageHeight < 100) {
                imageHeight = height;
            }

            if (height > tallestImg) {
                tallestImg = height;
            }

            // let type = 'image';

            // if (image.type) {
            //     type = image.type.split('/')[0];
            // }

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
