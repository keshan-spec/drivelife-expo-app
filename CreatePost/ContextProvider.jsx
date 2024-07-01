import React, { createContext, useContext, useEffect, useState } from 'react';

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

    return (
        <PostContext.Provider value={{ selectedPhotos, setSelectedPhotos, step, setStep, updateSelectedImage, taggedEntities, setTaggedEntities }}>
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
