
import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { View, Image, FlatList, StyleSheet, Dimensions, SafeAreaView, TouchableOpacity, Text, Alert, ActivityIndicatorBase, ActivityIndicator } from 'react-native';
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
import ViewAlbums from './ViewAlbum';
import FastImage from 'react-native-fast-image';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';

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
                Alert.alert('Oops!', 'File too large - please select a video less than 30 seconds & under 100MB');
                return;
            }
            onSelectImage(image);
        }}>
            <Image
                source={{ uri: image.thumbnail, width: 60, height: 60, cache: 'force-cache' }}
                style={[styles.image, isSelected && styles.selectedImageTile]}
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
            <View style={{ textAlign: 'center', marginTop: 20, color: 'white', flex: 1, alignItems: 'center' }}>
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
                )
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
            return true; // Permission granted
        }

        return true; // Permission granted
    } catch (err) {
        console.log('Error requesting Media Library permissions:', err, Platform.OS);
        showSettingsAlert({
            title: 'Storage Permission',
            message: 'Storage access is required to select photos. Please enable it in the settings.',
        });
        return false;
    }
}

const ImageSelector = ({ navigation, onClose }) => {
    const { selectedPhotos, setSelectedPhotos, setStep } = usePostProvider();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [isMultiSelect, setIsMultiSelect] = useState(false);
    const [mediaFilter, setmediaFilter] = useState(null);
    const [showAlbums, setShowAlbums] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        if (mediaFilter) {
            setPhotos([]);
            setSelectedPhotos([]);
            getPhotos(undefined);
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

    const getPhotos = async (lastAssetId) => {
        try {
            if (!hasPermission) {
                const permissions = await checkAndRequestMediaLibraryPermissions();

                if (!permissions) {
                    return;
                }

                setHasPermission(true);
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
                after: lastAssetId || undefined, // Pagination: Fetch assets after the last fetched asset
            });

            const { assets, hasNextPage } = gallery;

            if (!hasNextPage) {
                setHasNextPage(false);
            }

            const images = await Promise.all(
                assets.map(async (asset) => {
                    const { localUri, } = await MediaLibrary.getAssetInfoAsync(asset.id);
                    const { size } = await stat(localUri);

                    const { thumbnailBase64 } = await CameraRoll.getPhotoThumbnail(asset.id, {
                        quality: 0.5,
                        targetSize: {
                            height: 20,
                            width: 20,
                        },
                    })

                    const mimeType = asset.filename.split('.').pop();
                    const type = asset.mediaType === 'photo' ? 'image' : 'video';

                    // max 100mb
                    const exceedsSize = size > MAX_FILE_SIZE;
                    const exceedsDuration = type === 'video' && asset.duration > 30;

                    return {
                        uri: asset.uri,
                        thumbnail: `data:image/${mimeType};base64,${thumbnailBase64}`,
                        localUri,
                        fileName: asset.filename,
                        fileSize: size,
                        type: `${type}/${mimeType}`,
                        width: asset.width,
                        height: asset.height,
                        id: asset.id,
                        duration: asset.duration,
                        disabled: exceedsSize || exceedsDuration,
                    };
                })
            );

            // const filteredImages = images.filter((image) => image !== null);

            // Append the new assets to the existing list
            setPhotos((prevPhotos) => [...prevPhotos, ...images]);

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
            Alert.alert('Oops!', 'Error getting photos');
            setLoading(false);
        }
    };

    const loadMorePhotos = () => {
        if (hasNextPage && !loading) {
            setLoading(true);
            getPhotos(photos[photos.length - 1].id);
        }
    };

    const onSelectImage = (image) => {
        if (isMultiSelect) {
            // max 5 photos
            if (selectedPhotos.length >= 5) {
                // if image is already selected, remove it
                if (selectedPhotos.some(photo => photo.uri === image.uri)) {
                    setSelectedPhotos(selectedPhotos.filter(photo => photo.uri !== image.uri));
                } else {
                    Alert.alert('Oops!', 'You can only select up to 5 photos');
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

    useEffect(() => {
        getPhotos();
    }, []);

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
                key={lastAddedPhoto.id}
                source={{
                    uri: lastAddedPhoto.localUri,
                    priority: FastImage.priority.normal,
                }}
                style={styles.selectedImage}
                resizeMode={FastImage.resizeMode.contain}
            />
        );
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

    const Loader = useMemo(() => {
        return (
            (hasNextPage && photos.length > 0) && (
                <ActivityIndicator size="small" color="white" style={{ marginTop: 20 }} />
            )
        );
    }, [hasNextPage, photos]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
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

