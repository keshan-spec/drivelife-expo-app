
import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Dimensions, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { launchCamera } from 'react-native-image-picker';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { Platform, ToastAndroid } from "react-native";
import { usePostProvider } from './ContextProvider';
import CustomVideo from './Components/Video';
import { stat } from 'react-native-fs';
import { checkCameraPermission, checkStoragePermission, showSettingsAlert } from '../permissions/camera';

import FastImage from 'react-native-fast-image';

import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import ViewAlbums from './ViewAlbums';

const numColumns = 4;
const screenWidth = Dimensions.get('window').width;
const MAX_FILE_SIZE = 100 * 1024 * 1024;

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
    const memoizedRenderItem = useCallback(({ item, index }) => {
        if (item.empty) {
            return <View style={[styles.item, styles.itemInvisible]} />;
        }

        const isSelected = selectedPhotos.some(photo => photo.uri === item.uri);
        const indexInSelectedPhotos = getSelectMediaIndex(selectedPhotos, item);

        return (
            <TouchableOpacity style={[styles.item, {
                opacity: item.disabled ? 0.3 : 1,
            }]} onPress={() => {
                if (item.disabled) {
                    // show small toast
                    ToastAndroid.showWithGravity(
                        'File too large - please select a video less than 30 seconds & under 100MB',
                        ToastAndroid.SHORT,
                        ToastAndroid.CENTER // You can use ToastAndroid.TOP, ToastAndroid.BOTTOM, etc.
                    );
                    return;
                }

                onSelectImage(item);
            }}>
                <FastImage
                    style={[styles.image, isSelected && styles.selectedImageTile]}
                    source={{
                        uri: item.uri,
                        priority: FastImage.priority.normal,
                    }}
                    resizeMode={FastImage.resizeMode.cover}
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
    }, [selectedPhotos]);

    return (
        <FlatList
            data={formatData(photos, numColumns)}
            style={styles.container}
            renderItem={memoizedRenderItem}
            numColumns={numColumns}
            keyExtractor={(_, index) => index.toString()}
            onEndReached={loadMorePhotos}
            onEndReachedThreshold={0.5}
            initialNumToRender={10}  // Render a limited number of items initially
            windowSize={10}          // How many items should be kept in memory
            maxToRenderPerBatch={5}  // Limits rendering batches to improve performance
        />
    );
};

const ImageSelector = ({ navigation, onClose }) => {
    const { selectedPhotos, setSelectedPhotos, setStep } = usePostProvider();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [isMultiSelect, setIsMultiSelect] = useState(false);
    const [mediaFilter, setmediaFilter] = useState(null);
    const [showAlbums, setShowAlbums] = useState(false);

    useEffect(() => {
        if (mediaFilter) {
            setSelectedPhotos([]);
            setPage(1);
            setPhotos([]);
            getPhotos(1);
            setHasNextPage(true);
            setIsMultiSelect(false);
            setLoading(false);
        }
    }, [mediaFilter]);

    useEffect(() => {
        if (selectedPhotos.length === 0 && photos.length > 0) {
            const nonDisabledPhoto = photos.find(photo => !photo.disabled);
            if (nonDisabledPhoto) {
                setSelectedPhotos([nonDisabledPhoto]);
            }
        }
    }, [selectedPhotos, photos]);

    useEffect(() => {
        getPhotos(page);
    }, []);

    const onSelectImage = (image) => {
        if (isMultiSelect) {

            // max 5 photos
            if (selectedPhotos.length >= 5) {
                // if already selected, remove it
                if (selectedPhotos.some(photo => photo.uri === image.uri)) {
                    setSelectedPhotos(prevSelectedPhotos => prevSelectedPhotos.filter(photo => photo.uri !== image.uri));
                } else {
                    ToastAndroid.showWithGravity(
                        'Maximum 5 photos allowed',
                        ToastAndroid.SHORT,
                        ToastAndroid.CENTER // You can use ToastAndroid.TOP, ToastAndroid.BOTTOM, etc.
                    );
                }
                return;
            }

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

    const getPhotos = async (page) => {
        try {
            if (Platform.OS === "android" && !(await MediaLibrary.requestPermissionsAsync())) {
                return;
            }

            let mediaType = ['video', 'photo'];
            let albumId = null;

            if (mediaFilter) {
                if (mediaFilter.id === 'all') {
                    mediaType = ['video', 'photo'];
                } else {
                    mediaType = mediaFilter.mediaType;
                    albumId = mediaFilter.id;
                }
            }

            setLoading(true);
            const gallery = await MediaLibrary.getAssetsAsync({
                first: 20 * page, // Pagination: 20 items per page
                mediaType: mediaType,
                sortBy: ['creationTime'],
                album: albumId,  // If an album is selected, fetch from that album
            });

            const { assets, hasNextPage } = gallery;

            if (!hasNextPage) {
                setHasNextPage(false);
            }

            const images = assets.map(async (asset) => {
                let { size } = await stat(asset.uri);

                const mimeType = asset.filename.split('.').pop();
                const type = asset.mediaType === 'photo' ? 'image' : 'video';

                // max 100mb
                const exceedsSize = size > MAX_FILE_SIZE;
                const exceedsDuration = type === 'video' && asset.duration > 30;

                return {
                    uri: asset.uri,
                    fileName: asset.filename,
                    fileSize: size,
                    type: `${type}/${mimeType}`,
                    width: asset.width,
                    height: asset.height,
                    id: asset.id,
                    duration: asset.duration,
                    disabled: exceedsSize || exceedsDuration,
                };
            });

            const media = await Promise.all(images);

            setPhotos(media);

            if (selectedPhotos.length === 0 && media.length > 0) {
                // get the first NON disabled photo
                const nonDisabledPhoto = media.find(photo => !photo.disabled);
                if (nonDisabledPhoto) {
                    setSelectedPhotos([nonDisabledPhoto]);
                }
            }
            setLoading(false);

        } catch (error) {
            console.log('Error getting photos', error);
            showSettingsAlert({
                title: 'Storage Permission',
                message: 'Storage access is required to select photos. Please enable it in the settings.',
            });
            setLoading(false);
        }
    };

    const openImagePicker = () => {
        setShowAlbums(true);
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
            <FastImage
                key={lastAddedPhoto.uri}
                source={{
                    uri: lastAddedPhoto.uri,
                    priority: FastImage.priority.normal,
                }}
                style={styles.selectedImage}
                resizeMode={FastImage.resizeMode.contain}
            />
        );
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
    }, [loading, hasNextPage, mediaFilter]);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ViewAlbums
                onClose={() => {
                    setShowAlbums(false);
                }}
                onSelect={(album) => {
                    setmediaFilter(album);
                }}
                title={'Select Album'}
                visible={showAlbums}
            />

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
                        // marginLeft: 10,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        <Text style={[styles.poppinsFont, { color: 'white' }]}>
                            {mediaFilter ? mediaFilter.title : 'Recent'}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={18} color="white" />
                    </TouchableOpacity>

                    <View style={{
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

                        {/* <TouchableOpacity onPress={openCamera} style={styles.multiSelectBtn}>
                            <Ionicons name="camera-outline" size={18} color="white" />
                        </TouchableOpacity> */}
                    </View>
                </View>

                {(loading && photos.length === 0) ? (
                    <Text style={{ color: 'white', backgroundColor: '#000', textAlign: 'center', paddingTop: 20 }}>
                        Loading...
                    </Text>
                ) : null}

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
        width: '100%',
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
        color: '#ae9159',
    },
    item: {
        flex: 1,
        margin: 1,
        position: 'relative',
    },
    itemInvisible: {
        backgroundColor: '#000',
    },
    image: {
        width: (screenWidth / numColumns) - 2,
        height: (screenWidth / numColumns) - 2,
    },
    selectedImageTile: {
        backgroundColor: 'rgba(255, 170, 10, 0.9)',
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

