import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchUserGarage } from './actions/create-post';

export const PostContext = createContext();

export const PostProvider = ({ children, userId }) => {
    const [selectedPhotos, setSelectedPhotos] = useState([]);
    const [step, setStep] = useState(0);
    const [taggedEntities, setTaggedEntities] = useState([]);
    const [caption, setCaption] = useState('');
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [userGarage, setUserGarage] = useState([]);

    useEffect(() => {
        const asyncFunc = async () => {
            try {
                const data = await fetchUserGarage(userId);
                setUserGarage(data);
            } catch (error) {
                console.error(error);
            }
        };

        asyncFunc();
    }, []);


    useEffect(() => {
        if (step === 0) {
        }
    }, [step]);

    const updateSelectedImage = (index, image) => {
        const updatedImages = [...selectedPhotos];
        updatedImages[index] = image;
        setSelectedPhotos(updatedImages);
    };

    return (
        <PostContext.Provider value={{ userGarage, activeImageIndex, setActiveImageIndex, caption, setCaption, selectedPhotos, setSelectedPhotos, step, setStep, updateSelectedImage, taggedEntities, setTaggedEntities }}>
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