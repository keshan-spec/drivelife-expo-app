import React, { useRef, useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Animated, PanResponder, TouchableOpacity, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as MediaLibrary from 'expo-media-library';


const ViewAlbums = ({ visible, onClose, title, onSelect }) => {
    const translateY = useRef(new Animated.Value(500)).current;
    const [albums, setAlbums] = useState([]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 0,
            onPanResponderMove: (_, gestureState) => {
                translateY.setValue(gestureState.dy);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    Animated.timing(translateY, {
                        toValue: 500,
                        duration: 100,
                        useNativeDriver: true,
                    }).start(() => {
                        onClose();
                    });
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
            }).start();

            fetchAlbumsWithThumbnails();
        }
    }, [visible]);

    const fetchAlbumsWithThumbnails = async () => {
        try {
            const fetchedAlbums = await CameraRoll.getAlbums({ assetType: 'All' });
            const albumsWithThumbnails = await Promise.all(
                fetchedAlbums.map(async (album) => {
                    const photos = await CameraRoll.getPhotos({
                        first: 1,
                        assetType: 'All',
                        groupName: album.title,

                        groupTypes: 'Album',
                    });
                    const thumbnail = photos.edges.length > 0 ? photos.edges[0].node.image.uri : null;
                    return { ...album, thumbnail };
                })
            );

            // even out the album count so that the grid looks good
            if (albumsWithThumbnails.length % 3 === 1) {
                albumsWithThumbnails.push({ title: 'dummy___', count: 0, thumbnail: null });
                albumsWithThumbnails.push({ title: 'dummy___', count: 0, thumbnail: null });
            } else if (albumsWithThumbnails.length % 3 === 2) {
                albumsWithThumbnails.push({ title: 'dummy___', count: 0, thumbnail: null });
            }

            setAlbums(albumsWithThumbnails);
        } catch (error) {
            console.error('Error fetching albums with thumbnails:', error);
        }
    };

    const handleAlbumSelect = (album) => {
        const data = {
            title: album.title,
            id: album.id,
            mediaType: ['video', 'photo'],
        };

        onSelect(data); // Trigger the onSelect prop when an album is selected
        onClose();
    };

    const handleClose = () => {
        Animated.timing(translateY, {
            toValue: 500,
            duration: 100,
            useNativeDriver: true,
        }).start(() => {
            onClose();
        });
    };

    const renderAlbum = ({ item }) => {
        // trim the title if it's too long
        let title = item.title;
        if (title.length > 18) {
            title = title.substring(0, 18) + '...';
        }

        // if dummy
        if (item.title === 'dummy___' && item.count === 0) {
            return <View style={styles.albumItem} />;
        }

        return (
            <TouchableOpacity style={styles.albumItem} onPress={() => handleAlbumSelect(item)}>
                <Image
                    style={styles.albumImage}
                    source={{ uri: item.thumbnail }}
                />

                <Text style={styles.albumText}>
                    {title}
                </Text>
                <Text style={styles.albumSubText}>
                    {item.count}
                </Text>
            </TouchableOpacity>
        );
    }

    const renderIconButton = (iconName, label, filterData) => (
        <TouchableOpacity style={styles.iconButton}
            onPress={() => {
                onSelect(filterData);
                onClose();
            }}
        >
            <MaterialCommunityIcons name={iconName} size={24} color="black" />
            <Text style={styles.iconLabel}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.background} onPress={handleClose} />
                <Animated.View
                    style={[styles.bottomSheetContainer, { transform: [{ translateY }] }]}
                >
                    <View
                        style={styles.header}
                        {...panResponder.panHandlers} // Apply panResponder only to the header
                    >
                        <Text></Text>
                        <Text style={styles.headerText}>Albums</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <MaterialCommunityIcons name="close" size={20} color="black" />
                        </TouchableOpacity>
                    </View>

                    {/* Buttons Row */}
                    <View style={styles.buttonsContainer}>
                        {renderIconButton('clock-outline', 'Recent', {
                            title: 'Recent',
                            mediaType: ['video', 'photo'],
                        })}
                        {/* {renderIconButton('star-outline', 'Favourites', {
                            title: 'Favourites',
                            mediaType: ['video', 'photo'],
                        })} */}
                        {renderIconButton('image-outline', 'Photos', {
                            title: 'Photos',
                            mediaType: ['photo'],
                        })}
                        {renderIconButton('video-outline', 'Videos', {
                            title: 'Videos',
                            mediaType: ['video'],
                        })}
                    </View>

                    {albums.length === 0 && (
                        <Text style={{ textAlign: 'center', marginTop: 20 }}>
                            No albums found
                        </Text>
                    )}

                    {/* Albums Grid */}
                    <FlatList
                        data={albums}
                        renderItem={renderAlbum}
                        keyExtractor={(item) => item.title}
                        numColumns={3}
                        contentContainerStyle={styles.albumList}
                    />
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    background: {
        flex: 1,
    },
    bottomSheetContainer: {
        height: '95%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    header: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 20,
    },
    headerText: {
        fontSize: 16,
        color: 'black',
        minWidth: 80,
        textAlign: 'right',
        fontFamily: 'Poppins_500Medium',
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10,
        marginVertical: 10,
    },
    iconButton: {
        alignItems: 'center',
    },
    iconLabel: {
        marginTop: 5,
        fontSize: 12,
        color: 'black',
    },
    divider: {
        height: 1,
        backgroundColor: '#ddd',
        marginVertical: 10,
    },
    albumList: {
        padding: 10,
    },
    albumItem: {
        margin: 5,
        flex: 1,
        alignItems: 'center',
    },
    albumImage: {
        width: 110,
        height: 110,
        borderRadius: 6,
    },
    albumText: {
        marginTop: 5,
        textAlign: 'center',
        fontSize: 12,
        color: 'black',
    },
    albumSubText: {
        marginTop: 2,
        textAlign: 'center',
        fontSize: 10,
        color: '#777',
    },
});

export default ViewAlbums;