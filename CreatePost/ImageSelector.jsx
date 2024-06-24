
import React, { useState, useEffect } from 'react';
import { View, Image, FlatList, StyleSheet, Dimensions, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
// https://icons.expo.fyi/Index
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

// https://www.npmjs.com/package/@react-native-camera-roll/camera-roll
import { PermissionsAndroid, Platform } from "react-native";
import { usePostProvider } from './ContextProvider';

import CustomVideo from './Components/Video';
import PannableImage from './Components/Image';

const numColumns = 4;
const screenWidth = Dimensions.get('window').width;



async function hasAndroidPermission() {
    const getCheckPermissionPromise = () => {
        if (Platform.Version >= 33) {
            return Promise.all([
                PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES),
                PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO),
                PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA),
            ]).then(
                ([hasReadMediaImagesPermission, hasReadMediaVideoPermission, hasCameraPermission]) =>
                    hasReadMediaImagesPermission && hasReadMediaVideoPermission && hasCameraPermission,
            );
        } else {
            return Promise.all([
                PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE),
                PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA),
            ]).then(
                ([hasReadExternalStoragePermission, hasCameraPermission]) =>
                    hasReadExternalStoragePermission && hasCameraPermission,
            );
        }
    };

    const hasPermission = await getCheckPermissionPromise();
    if (hasPermission) {
        return true;
    }

    const getRequestPermissionPromise = () => {
        if (Platform.Version >= 33) {
            return PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
                PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
                PermissionsAndroid.PERMISSIONS.CAMERA,
            ]).then(
                (statuses) =>
                    statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] ===
                    PermissionsAndroid.RESULTS.GRANTED &&
                    statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] ===
                    PermissionsAndroid.RESULTS.GRANTED &&
                    statuses[PermissionsAndroid.PERMISSIONS.CAMERA] ===
                    PermissionsAndroid.RESULTS.GRANTED,
            );
        } else {
            return Promise.all([
                PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE),
                PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA),
            ]).then(([readExternalStorageStatus, cameraStatus]) =>
                readExternalStorageStatus === PermissionsAndroid.RESULTS.GRANTED &&
                cameraStatus === PermissionsAndroid.RESULTS.GRANTED
            );
        }
    };

    return await getRequestPermissionPromise();
}

const formatData = (photos, numColumns) => {
    const numberOfFullRows = Math.floor(photos.length / numColumns);

    let numberOfElementsLastRow = photos.length - (numberOfFullRows * numColumns);
    while (numberOfElementsLastRow !== numColumns && numberOfElementsLastRow !== 0) {
        photos.push({ key: `blank-${numberOfElementsLastRow}`, empty: true });
        numberOfElementsLastRow++;
    }

    return photos;
};

const PhotoGrid = ({ photos, loadMorePhotos, onSelectImage, selectedPhotos, isMultiSelect }) => {
    const renderItem = ({ item, index }) => {
        if (item.empty) {
            return <View style={[styles.item, styles.itemInvisible]} />;
        }

        const isSelected = selectedPhotos.some(photo => photo.uri === item.uri);
        const indexInSelectedPhotos = selectedPhotos.indexOf(item);

        return (
            <TouchableOpacity style={styles.item} onPress={() => onSelectImage(item)}>
                <Image
                    key={index}
                    source={{ uri: item.uri }}
                    style={[styles.image, isSelected && styles.selectedImageTile]}
                />

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
            keyExtractor={(item, index) => index.toString()}
            onEndReached={loadMorePhotos}
            onEndReachedThreshold={.5}
        />
    );
};

const ImageSelector = ({ navigation, onClose }) => {
    const { selectedPhotos, setSelectedPhotos, setStep } = usePostProvider();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [isMultiSelect, setIsMultiSelect] = useState(false);

    useEffect(() => {
        if (selectedPhotos.length === 0 && photos.length > 0) {
            setSelectedPhotos([photos[0]]);
        }
    }, [selectedPhotos]);


    const getPhotos = async (page) => {
        if (Platform.OS === "android" && !(await hasAndroidPermission())) {
            return;
        }

        const gallery = await CameraRoll.getPhotos({
            first: 20 * page,
            assetType: 'All',
            include: ['fileSize', 'image', 'filename', 'uri', 'width', 'height', 'type', 'location'],
            mimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4'],
            groupTypes: 'All',
        });

        const { edges } = gallery;

        const images = edges.map((photo) => {
            return {
                uri: photo.node.image.uri,
                filename: photo.node.image.filename,
                fileSize: photo.node.image.fileSize,
                type: photo.node.type,
                width: photo.node.image.width,
                height: photo.node.image.height,
            };
        });

        setPhotos(images);

        if (selectedPhotos.length === 0 && images.length > 0) {
            setSelectedPhotos([images[0]]);
        }
    };

    const loadMorePhotos = () => {
        if (!loading) {
            setLoading(true);
            setPage(prevPage => {
                const newPage = prevPage + 1;
                getPhotos(newPage);
                setLoading(false);
                return newPage;
            });
        }
    };

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

        console.log(lastAddedPhoto);

        if (lastAddedPhoto && lastAddedPhoto.type && lastAddedPhoto.type.startsWith('video')) {
            return <CustomVideo video={lastAddedPhoto} />;
        }

        return (
            <PannableImage
                key={lastAddedPhoto.uri}
                image={lastAddedPhoto}
            />
        );

        return (
            <FlatList
                data={selectedPhotos.reverse()}
                horizontal
                pagingEnabled
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => {
                    const isVideo = item.type && item.type.startsWith('video');

                    if (isVideo) {
                        return <CustomVideo video={item} />;
                    }

                    return <Image
                        source={{ uri: item.uri }}
                        style={styles.selectedImage}
                        resizeMode="cover"
                    />;
                }}
            />
        );
    };

    const openImagePicker = () => {
        const options = {
            title: 'Select Images',

            selectionLimit: isMultiSelect ? 5 : 1,
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else {
                const selectedImages = response.assets.map(asset => ({ uri: asset.uri }));
                setSelectedPhotos(selectedImages);
            }
        });
    };

    const openCamera = () => {

        launchCamera({
            title: 'Take a photo',
            saveToPhotos: true,
            mediaType: 'mixed',
            durationLimit: 10,
        }, (response) => {
            console.log(response);

            if (response.didCancel) {
                console.log('User cancelled camera');
            } else if (response.error) {
                console.log('Camera Error: ', response.error);
            } else {
                const takenPhoto = response.assets[0];
                setSelectedPhotos([takenPhoto]);
            }
        });
    };

    return (
        // <GestureHandlerRootView style={{ flex: 1, backgroundColor: 'black' }}>
        <SafeAreaView style={{ flex: 1 }}>
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
                        padding: 5,
                        marginLeft: 10,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        <Text style={[styles.poppinsFont, { color: 'white' }]}>Recent</Text>
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

                        <TouchableOpacity onPress={openCamera} style={styles.multiSelectBtn}>
                            <Ionicons name="camera-outline" size={18} color="white" />
                        </TouchableOpacity>
                    </View>
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
        // </GestureHandlerRootView >
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
        justifyContent: 'flex-start',
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

