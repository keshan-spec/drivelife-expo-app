import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchGarageById, fetchUserGarage } from './actions/create-post';

export const PostContext = createContext();

export const PostProvider = ({ children, userId, association }) => {
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

                if (association.associationId) {
                    switch (association.associationType) {
                        case 'garage':
                            // check if the association is in the user's garage
                            const associationExists = data.find((car) => car.id == association.associationId);

                            if (associationExists) {
                                const entity = [{
                                    x: 1,
                                    y: 1,
                                    index: activeImageIndex,
                                    label: associationExists.registration,
                                    registration: associationExists.registration,
                                    id: associationExists.id,
                                    type: 'associated-car',
                                    arr_idx: taggedEntities.length,
                                }];

                                // check if the association is already tagged
                                const isTagged = taggedEntities.find((entity) =>
                                    entity.label.replace(/\s+/g, '').toLowerCase() === associationExists.registration.replace(/\s+/g, '').toLowerCase() &&
                                    entity.index === activeImageIndex
                                );

                                if (isTagged) {
                                    return;
                                }

                                setTaggedEntities([...taggedEntities, ...entity]);
                            } else {
                                // fetch garage details
                                const data = await fetchGarageById(association.associationId);

                                if (data && !data.error) {
                                    const label = data.registration || `${data.make} ${data.model}`;

                                    const entity = [{
                                        x: 1,
                                        y: 1,
                                        index: activeImageIndex,
                                        label: data.registration || `${data.make} ${data.model}`,
                                        registration: data.registration,
                                        id: data.id,
                                        type: 'car',
                                        arr_idx: taggedEntities.length,
                                    }];

                                    // check if the association is already tagged
                                    const isTagged = taggedEntities.find((entity) =>
                                        entity.label.replace(/\s+/g, '').toLowerCase() === label.replace(/\s+/g, '').toLowerCase() &&
                                        entity.index === activeImageIndex
                                    );

                                    if (isTagged) {
                                        return;
                                    }

                                    setTaggedEntities([...taggedEntities, ...entity]);
                                }
                            }
                            break;
                        default:
                            break;
                    }
                }

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