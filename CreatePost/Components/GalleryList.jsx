
import React, { memo } from 'react';
import { View, Image, FlatList, StyleSheet, Dimensions, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { usePostProvider } from '../ContextProvider';
import FastImage from 'react-native-fast-image';

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
                source={{ uri: image.uri, width: 60, height: 60, cache: 'force-cache' }}
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

const styles = StyleSheet.create({
    poppinsFont: {
        fontFamily: 'Poppins_500Medium',
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

    selectedImage: {
        width: screenWidth,
        height: '100%',
        maxHeight: 1380,
        resizeMode: 'contain',
    },
});

export default PhotoGrid;