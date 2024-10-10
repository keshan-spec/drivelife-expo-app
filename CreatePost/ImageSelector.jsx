
import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { View, FlatList, StyleSheet, Dimensions, SafeAreaView, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
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

const IMAGE_SIZE = 50;

const formatData = (photos, numColumns) => {
    const formattedPhotos = [...photos];  // Create a shallow copy of the array
    const numberOfFullRows = Math.floor(formattedPhotos.length / numColumns);

    let numberOfElementsLastRow = formattedPhotos.length - (numberOfFullRows * numColumns);
    while (numberOfElementsLastRow !== numColumns && numberOfElementsLastRow !== 0) {
        formattedPhotos.push({ key: `blank-${numberOfElementsLastRow}`, empty: true });
        numberOfElementsLastRow++;
    }

    return formattedPhotos;
};

const getSelectMediaIndex = (selectedPhotos, image) => {
    return selectedPhotos.findIndex(photo => photo.uri === image.uri);
};

const ImageTile = memo(({ image, onSelectImage, isMultiSelect }) => {
    const { selectedPhotos } = usePostProvider();  // Make sure this hook doesn't cause extra re-renders

    if (image.empty) {
        return <View style={[styles.item, styles.itemInvisible]} />;
    }

    const isSelected = selectedPhotos.some(photo => photo.uri === image.uri);
    const indexInSelectedPhotos = getSelectMediaIndex(selectedPhotos, image);

    return (
        <TouchableOpacity style={[styles.item, { opacity: image.disabled ? 0.2 : 1 }]} onPress={() => {
            if (image.disabled) {
                // show small toast
                ToastAndroid.showWithGravity(
                    'File too large - please select a video less than 30 seconds & under 100MB',
                    ToastAndroid.SHORT,
                    ToastAndroid.CENTER // You can use ToastAndroid.TOP, ToastAndroid.BOTTOM, etc.
                );
                return;
            }
            onSelectImage(image);
        }}>
            <FastImage
                style={[styles.image, isSelected && styles.selectedImageTile]}
                source={{
                    uri: image.uri,
                    priority: FastImage.priority.normal,
                }}
                resizeMode={FastImage.resizeMode.cover}
            />

            {/* Multi-select icon logic */}
            {isMultiSelect && (
                isSelected ? (
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
                ) : (
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
                )
            )}
        </TouchableOpacity>
    );
}, (prevProps, nextProps) => (
    prevProps.image.uri === nextProps.image.uri &&
    prevProps.isMultiSelect === nextProps.isMultiSelect &&
    prevProps.onSelectImage === nextProps.onSelectImage
));

const PhotoGrid = memo(({ photos, loadMorePhotos, onSelectImage, isMultiSelect, Loader }) => {
    if (photos.length === 0) {
        return (
            <View style={{ textAlign: 'center', paddingTop: 20, color: 'white', flex: 1, alignItems: 'center', backgroundColor: '#000' }}>
                <ActivityIndicator size="small" color="white" style={{ marginTop: 20 }} />
            </View>
        );
    }

    return (
        <FlatList
            disableVirtualization
            data={formatData(photos, numColumns)}
            style={styles.container}
            renderItem={({ item, index }) => {
                return (
                    <ImageTile
                        image={item}
                        onSelectImage={onSelectImage}
                        isMultiSelect={isMultiSelect}
                    />
                );
            }}
            removeClippedSubviews={true}
            numColumns={numColumns}
            keyExtractor={(item, index) => item.id}
            onEndReached={loadMorePhotos}
            onEndReachedThreshold={.5}
            ListFooterComponent={Loader}
            windowSize={5}
            initialNumToRender={12}  // Render a limited number of items initially
            getItemLayout={(data, index) => (
                { length: IMAGE_SIZE, offset: IMAGE_SIZE * index, index }
            )}
        />
    );
});

const ImageSelector = ({ navigation, onClose }) => {
    const { selectedPhotos, setSelectedPhotos, setStep } = usePostProvider();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [isMultiSelect, setIsMultiSelect] = useState(false);
    const [mediaFilter, setmediaFilter] = useState(null);
    const [showAlbums, setShowAlbums] = useState(false);
    const [lastAssetId, setLastAssetId] = useState(null);

    useEffect(() => {
        if (mediaFilter) {
            setSelectedPhotos([]);
            setPhotos([]);
            setHasNextPage(true);
            setIsMultiSelect(false);
            setLoading(false);
            getPhotos(true);
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
        getPhotos(true);
    }, []);

    const getPhotos = async (reset) => {
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
                first: 20, // Pagination: 20 items per page
                mediaType: mediaType,
                sortBy: ['creationTime'],
                album: albumId,  // If an album is selected, fetch from that album
                after: (lastAssetId && !reset) ? lastAssetId : undefined, // Pagination: Fetch assets after the last fetched asset
            });

            const { assets, hasNextPage, endCursor } = gallery;
            setLastAssetId(endCursor);

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

            setPhotos((prevPhotos) => [...prevPhotos, ...media]);

            if (selectedPhotos.length === 0 && images.length > 0) {
                // get the first NON disabled photo
                const nonDisabledPhoto = images.find(photo => !photo.disabled);
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
                <Text
                    style={{
                        color: 'white',
                        textAlign: 'center',
                        fontSize: 12,
                        fontFamily: 'Poppins_500Medium',
                    }}
                >
                    No photos selected
                </Text>
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

    const loadMorePhotos = () => {
        if (hasNextPage && !loading) {
            setLoading(true);
            getPhotos(false);
        }
    };

    const Loader = useMemo(() => {
        return (
            (hasNextPage && photos.length > 0) && (
                <ActivityIndicator size="small" color="white" style={{ marginTop: 40, marginBottom: 20 }} />
            )
        );
    }, [hasNextPage, photos]);

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
                    <TouchableOpacity onPress={onClose}
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <Ionicons name="close" size={16} color="white" />
                        <Text style={[styles.headerText, styles.poppinsFont]}>
                            {` `} New Post
                        </Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => {
                    setStep(1);
                    navigation.navigate('SharePost');
                }}>
                    <Text style={[styles.closeButton, styles.poppinsFont]}>Next</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.topHalf}>
                {renderSelectedPhotos()}
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

                <PhotoGrid
                    photos={photos}
                    loadMorePhotos={loadMorePhotos}
                    onSelectImage={onSelectImage}
                    isMultiSelect={isMultiSelect}
                    Loader={Loader}
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

