
import React, { useState, useEffect, useCallback } from 'react';
import { View, Image, FlatList, StyleSheet, Dimensions, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
// https://icons.expo.fyi/Index
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

// https://www.npmjs.com/package/@react-native-camera-roll/camera-roll
import { Platform } from "react-native";
import { usePostProvider } from './ContextProvider';

import CustomVideo from './Components/Video';
import { stat } from 'react-native-fs';
import { checkCameraPermission, checkStoragePermission, showSettingsAlert } from '../permissions/camera';

import * as FileSystem from 'expo-file-system';
import { requestIOSMediaPermissions } from '../utils';

const numColumns = 4;
const screenWidth = Dimensions.get('window').width;

const formatData = (photos, numColumns) => {
    const numberOfFullRows = Math.floor(photos.length / numColumns);

    let numberOfElementsLastRow = photos.length - (numberOfFullRows * numColumns);
    while (numberOfElementsLastRow !== numColumns && numberOfElementsLastRow !== 0) {
        photos.push({ key: `blank-${numberOfElementsLastRow}`, empty: true });
        numberOfElementsLastRow++;
    }

    return photos;
};

const getSelectMediaIndex = (selectedPhotos, image) => {
    return selectedPhotos.findIndex(photo => photo.uri === image.uri);
};

const PhotoGrid = ({ photos, loadMorePhotos, onSelectImage, selectedPhotos, isMultiSelect }) => {
    const renderItem = ({ item, index }) => {
        if (item.empty) {
            return <View style={[styles.item, styles.itemInvisible]} />;
        }

        const isSelected = selectedPhotos.some(photo => photo.uri === item.uri);
        const indexInSelectedPhotos = getSelectMediaIndex(selectedPhotos, item);

        return (
            <TouchableOpacity style={styles.item} onPress={() => onSelectImage(item)}>
                <Image
                    key={index}
                    source={{ uri: item.uri }}
                    style={[styles.image, isSelected && styles.selectedImageTile]}
                />

                {/* if not selected */}
                {isMultiSelect && !isSelected && (
                    <MaterialCommunityIcons
                        name="checkbox-blank-circle-outline"
                        size={25}
                        color="white"
                        style={{
                            position: 'absolute',
                            top: 5,
                            right: 5,
                        }}
                    />
                )}

                {isMultiSelect && isSelected && (
                    // number
                    <View style={{
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        backgroundColor: 'rgba(59, 84, 245, 0.5)',
                        borderRadius: 9999,
                        width: 25,
                        height: 25,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <Text style={{ color: 'white' }}>{indexInSelectedPhotos + 1}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <FlatList
            data={formatData(photos, numColumns)}
            style={styles.container}
            renderItem={renderItem}
            numColumns={numColumns}
            keyExtractor={(_, index) => index.toString()}
            onEndReached={loadMorePhotos}
            onEndReachedThreshold={.2}
        />
    );
};

export async function checkAndRequestMediaLibraryPermissions() {
    try {
        // Check if the platform is Android
        if (Platform.OS === "android") {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                console.log('Media Library permission not granted on Android');
                return false; // Exit the function if permission is not granted
            }
        }
        // iOS will also use MediaLibrary.requestPermissionsAsync()
        else if (Platform.OS === "ios") {
            const permissions = await requestIOSMediaPermissions();

            // console.log('permissions', permissions);

            // if (permissions.some(permission => permission !== 'granted')) {
            //     console.log('Media Library permission not granted on iOS');
            //     return false; // Exit the function if permission is not granted
            // }

            return true; // Permission granted
        }

        return true; // Permission granted
    } catch (err) {
        console.log('Error requesting Media Library permissions:', err, Platform.OS);
        return false;
    }
}

const ImageSelector = ({ navigation, onClose }) => {
    const { selectedPhotos, setSelectedPhotos, setStep } = usePostProvider();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [isMultiSelect, setIsMultiSelect] = useState(false);

    useEffect(() => {
        if (selectedPhotos.length === 0 && photos.length > 0) {
            setSelectedPhotos([photos[0]]);
        }
    }, [selectedPhotos]);

    const getPhotos = async (page) => {
        try {
            const hasPermission = await checkAndRequestMediaLibraryPermissions();
            if (!hasPermission) {
                return;
            }

            const gallery = await MediaLibrary.getAssetsAsync({
                first: 20 * page,
                mediaType: ['photo'],
                sortBy: ['creationTime'],
            });

            const { assets, hasNextPage } = gallery;

            if (!hasNextPage) {
                setHasNextPage(false);
            }

            const images = await Promise.all(
                assets.map(async (asset) => {
                    // Check if the file exists before accessing it
                    const fileExists = await FileSystem.getInfoAsync(asset.uri);
                    if (!fileExists.exists) {
                        console.log(`File does not exist: ${asset.uri}`);
                        return null;
                    }

                    let { size } = await FileSystem.getInfoAsync(asset.uri, { size: true });

                    const mimeType = asset.filename.split('.').pop();
                    const type = asset.mediaType === 'photo' ? 'image' : 'video';

                    return {
                        uri: asset.uri,
                        fileName: asset.filename,
                        fileSize: size,
                        type: `${type}/${mimeType}`,
                        width: asset.width,
                        height: asset.height,
                        id: asset.id,
                    };
                })
            );

            const filteredImages = images.filter((image) => image !== null);

            setPhotos(filteredImages);

            if (selectedPhotos.length === 0 && filteredImages.length > 0) {
                setSelectedPhotos([filteredImages[0]]);
            }
        } catch (error) {
            console.log('Error getting photos', error);
            showSettingsAlert({
                title: 'Storage Permission',
                message: 'Storage access is required to select photos. Please enable it in the settings.',
            });
        }
    };

    const loadMorePhotos = useCallback(() => {
        if (hasNextPage && !loading) {
            setLoading(true);
            setPage(prevPage => {
                const newPage = prevPage + 1;
                getPhotos(newPage);
                setLoading(false);
                return newPage;
            });
        }
    }, [loading, hasNextPage]);

    const onSelectImage = (image) => {
        if (isMultiSelect) {
            setSelectedPhotos((prevSelectedPhotos) => {
                if (prevSelectedPhotos.some(photo => photo.uri === image.uri)) {
                    return prevSelectedPhotos.filter(photo => photo.uri !== image.uri);
                } else {
                    return [...prevSelectedPhotos, image];
                }
            });
        } else {
            setSelectedPhotos([image]);
        }
    };

    useEffect(() => {
        getPhotos(page);
    }, []);

    const renderSelectedPhotos = () => {
        if (selectedPhotos.length === 0) {
            return (
                <Text>No photos selected</Text>
            );
        }

        const lastAddedPhoto = selectedPhotos[selectedPhotos.length - 1];
        if (lastAddedPhoto && lastAddedPhoto.type && lastAddedPhoto.type.startsWith('video')) {
            return <CustomVideo video={lastAddedPhoto} />;
        }

        return (
            <Image
                key={lastAddedPhoto.uri}
                source={{ uri: lastAddedPhoto.uri }}
                style={styles.selectedImage}
            />
        );
    };

    const openImagePicker = () => {

        launchImageLibrary({
            title: 'Select Images',
            mediaType: 'photo',
            presentationStyle: 'formSheet',
            selectionLimit: isMultiSelect ? 5 : 1,
            includeExtra: true,
        }, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else {
                const takenPhoto = response.assets[0];
                const id = takenPhoto.id.split('.')[0];
                setSelectedPhotos([{
                    ...takenPhoto,
                    id,
                }]);
            }
        });
    };

    const openCamera = async () => {
        const results = await checkCameraPermission();
        if (!results) {
            return;
        }

        launchCamera({
            title: 'Take a photo',
            saveToPhotos: true,
            mediaType: 'mixed',
            durationLimit: 10,
        }, (response) => {
            if (response.didCancel) {
                console.log('User cancelled camera');
            } else if (response.error) {
                console.log('Camera Error: ', response.error);
            } else {
                const takenPhoto = response.assets[0];
                console.log('Taken photo', takenPhoto);
                setSelectedPhotos([takenPhoto]);
                setStep(1);
                navigation.navigate('SharePost');
            }
        });
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
            <View style={styles.header}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: '50%',
                }}>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                    <Text style={[styles.headerText, styles.poppinsFont]}>
                        {` `} New Post
                    </Text>
                </View>
                <TouchableOpacity onPress={() => {
                    setStep(1);
                    navigation.navigate('SharePost');
                }}>
                    <Text style={[styles.closeButton, styles.poppinsFont]}>Next</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.topHalf}>
                {selectedPhotos.length === 0 && photos.length === 0 ?
                    (
                        <Text>No photos available</Text>
                    ) : (
                        renderSelectedPhotos()
                    )}
            </View>


            <View style={styles.bottomHalf}>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity onPress={openImagePicker} style={{
                        padding: 10,
                        marginLeft: 10,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        <Text style={[styles.poppinsFont, { color: 'white' }]}>Recent</Text>
                        <MaterialCommunityIcons name="chevron-down" size={18} color="white" />
                    </TouchableOpacity>

                    {/* <View style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 10,
                    }}>

                        <TouchableOpacity onPress={() => {
                            if (isMultiSelect) {
                                setSelectedPhotos([]);
                            }

                            setIsMultiSelect(!isMultiSelect);
                        }} style={styles.multiSelectBtn}>
                            {isMultiSelect ? (
                                <MaterialCommunityIcons name="card-multiple" size={18} color="white" />
                            ) :
                                (
                                    <MaterialCommunityIcons name="card-multiple-outline" size={18} color="white" />
                                )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={openCamera} style={styles.multiSelectBtn}>
                            <Ionicons name="camera-outline" size={18} color="white" />
                        </TouchableOpacity>
                    </View> */}
                </View>
                <PhotoGrid
                    photos={photos}
                    loadMorePhotos={loadMorePhotos}
                    onSelectImage={onSelectImage}
                    selectedPhotos={selectedPhotos}
                    isMultiSelect={isMultiSelect}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    multiSelectBtn: {
        // style a modern button
        backgroundColor: '#151617',
        borderRadius: 9999,
        padding: 10,
        margin: 5,
        color: 'white',
    },
    container: {
        flex: 1,
        backgroundColor: 'black',
        zIndex: 999,
    },
    poppinsFont: {
        fontFamily: 'Poppins_500Medium',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        backgroundColor: 'black',
        zIndex: 999,
    },
    headerText: {
        fontSize: 16,
        color: 'white',
        textAlign: 'center',
    },
    closeButton: {
        fontSize: 16,
        color: '#3b54f5',
    },
    item: {
        flex: 1,
        margin: 1,
        position: 'relative',
    },
    itemInvisible: {
        backgroundColor: '#363534',
    },
    image: {
        width: (screenWidth / numColumns) - 2,
        height: (screenWidth / numColumns) - 2,
    },
    selectedImageTile: {
        backgroundColor: 'rgba(59, 84, 245, 0.5)',
        opacity: 0.3,
    },
    topHalf: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#151617',
    },
    bottomHalf: {
        flex: 1,
        zIndex: 999,
    },
    selectedImage: {
        width: screenWidth,
        height: '100%',
        maxHeight: 1380,
        resizeMode: 'contain',
    },
    buttonContainer: {
        display: 'flex',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
    },
});

export default ImageSelector;

