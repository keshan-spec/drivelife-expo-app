import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, TouchableWithoutFeedback, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { usePostProvider } from './ContextProvider';

import { Ionicons } from '@expo/vector-icons';
import Collapsible from './Collapsible';
import { addPost, addTagsForPost, uploadFileInChunks } from './actions/create-post';
import { useCallback, useMemo, useState } from 'react';
import EditImage from './Components/EditImage';
import CustomVideo from './Components/Video';

const SharePost = ({ navigation, onComplete }) => {
    const { selectedPhotos, setStep, getImageMetaData, taggedEntities, updateSelectedImage } = usePostProvider();
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editImageIdx, setEditImageIdx] = useState(null);

    const isVideo = (media) => media.type.startsWith('video') ? true : false;

    const renderSelectedPhotos = useCallback(() => {
        if (selectedPhotos.length === 1) {
            if (isVideo(selectedPhotos[0])) {
                return <CustomVideo video={selectedPhotos[0]} />;
            }

            return (
                <TouchableWithoutFeedback onPress={() => setEditImageIdx(0)}>
                    <Image
                        source={{ uri: selectedPhotos[0].uri }}
                        style={styles.selectedImage}
                    />
                </TouchableWithoutFeedback>
            );
        }

        // if (data.length === 0 || data[data.length - 1].type !== 'add_more') {
        //     data.push({ type: 'add_more' });
        // }

        return (
            <FlatList
                data={selectedPhotos}
                horizontal
                pagingEnabled
                // contentContainerStyle={{ marginHorizontal: selectedPhotos.length > 1 ? 20 : 0 }}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ index, item }) => {
                    if (item.type === 'add_more') {
                        // an add more button
                        return (
                            <TouchableOpacity
                                style={{
                                    width: 200,
                                    height: '100%',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: '#151617',
                                }}
                                onPress={() => {
                                    navigation.goBack();
                                }}
                            >
                                <Ionicons name="add-circle" size={50} color="#fff" />
                                <Text style={{ color: '#fff', fontFamily: 'Poppins_500Medium' }}>Add More</Text>
                            </TouchableOpacity>
                        );
                    }

                    if (isVideo(item)) {
                        return <CustomVideo video={item} key={index} />;
                    }

                    return (
                        <TouchableWithoutFeedback
                            onPress={() => setEditImageIdx(index)}
                            key={index}
                        >
                            <Image
                                source={{ uri: item.uri }}
                                style={styles.selectedImage}
                            />
                        </TouchableWithoutFeedback>
                    );
                }}
            />
        );
    }, [selectedPhotos, editImageIdx]);

    const getFirstImageAspectRatio = () => {
        const images = selectedPhotos.filter((item) => !isVideo(item));
        const firstImage = images[0];
        const aspectRatio = firstImage.width / firstImage.height;
        return aspectRatio;
    };

    const firstImageIndex = useMemo(() => {
        return selectedPhotos.findIndex((item) => !isVideo(item));
    }, [selectedPhotos]);


    const onShare = async () => {
        if (loading) {
            return;
        }

        setLoading(true);
        try {
            const media = await getImageMetaData();
            const response = await addPost(1, media, caption);

            if (taggedEntities.length > 0) {
                await addTagsForPost(1, response.post_id, taggedEntities);
            }

            setLoading(false);
            onComplete(response.post_id);
        } catch (error) {
            console.log('Error sharing post:', error);
            setError('An error occurred while sharing your post. Please try again later.');
            setLoading(false);
        }
    };

    if (editImageIdx !== null) {
        return (
            <EditImage
                image={selectedPhotos[editImageIdx]}
                onSave={(data) => {
                    updateSelectedImage(editImageIdx, data);
                    setEditImageIdx(null);
                }}
                aspectLock={editImageIdx !== firstImageIndex}
                aspectRatio={editImageIdx === firstImageIndex ? 0 : getFirstImageAspectRatio()}
                onCancel={() => setEditImageIdx(null)}
            />
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollView}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => {
                        setStep(0);
                        navigation.goBack();
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                            <Ionicons name="chevron-back" size={20} color="black" />
                            <Text style={[styles.headerText, styles.poppinsFont]}>
                                {` `} Back
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#151617',
                    height: 350,
                }}>
                    {renderSelectedPhotos()}
                </View>

                <View style={styles.textAreaContainer} >
                    <TextInput
                        multiline={true}
                        defaultValue={caption}
                        onChangeText={setCaption}
                        numberOfLines={5}
                        style={styles.captionInput}
                        placeholder="Write a caption..."
                        placeholderTextColor="#aaa"
                    />
                </View>

                <Collapsible />
            </ScrollView>

            {/* loading */}
            {loading && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 999,
                }}>
                    <ActivityIndicator size="large" color="#ae9159" />
                </View>
            )}


            {/* ERROR */}
            {(error && !loading) && (
                <View style={[styles.errorMessage]}>
                    <Text />
                    <Text style={{ color: 'red', fontFamily: 'Poppins_500Medium', textAlign: 'center', maxWidth: 300 }}>{error}</Text>
                    <TouchableOpacity onPress={() => setError(null)}>
                        <Ionicons name="close" size={16} color="red" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Share Button */}
            <TouchableOpacity style={styles.shareButton} onPress={onShare}>
                <Text style={styles.shareButtonText}>Post Now</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    poppinsFont: {
        fontFamily: 'Poppins_500Medium',
    },
    headerText: {
        fontSize: 16,
        color: 'black',
        textAlign: 'center',
    },
    textAreaContainer: {
        borderColor: '#ccc',
        borderWidth: 1,
        padding: 5
    },
    captionInput: {
        marginTop: 10,
        justifyContent: "flex-start",
        textAlignVertical: 'top',
        maxHeight: 100,
        paddingHorizontal: 10,
        fontFamily: 'Poppins_500Medium',
    },
    selectedImage: {
        width: screenWidth,
        height: '100%',
        resizeMode: 'cover',
        marginRight: 20,
    },
    scrollView: {
        // padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        marginTop: 16,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    errorMessage: {
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8d7da',
    },
    shareButton: {
        backgroundColor: '#ae9159',
        padding: 8,
        alignItems: 'center',
        borderRadius: 8,
        margin: 16,
    },
    shareButtonText: {
        fontSize: 16,
        color: '#fff',
        fontFamily: 'Poppins_500Medium',
    },
});

export default SharePost;
