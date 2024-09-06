import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, TouchableWithoutFeedback, FlatList, Dimensions, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { usePostProvider } from './ContextProvider';

import { Ionicons } from '@expo/vector-icons';
import Collapsible from './Collapsible';
import { useCallback, useMemo, useState } from 'react';
import EditImage from './Components/EditImage';
import { KeyboardAccessoryView } from 'react-native-keyboard-accessory'


const SharePost = ({ navigation, onComplete }) => {
    const { selectedPhotos, setStep, taggedEntities, updateSelectedImage } = usePostProvider();
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editImageIdx, setEditImageIdx] = useState(null);

    const isVideo = (media) => media.type.startsWith('video') ? true : false;

    const renderSelectedPhotos = useCallback(() => {
        if (selectedPhotos.length === 1) {
            if (isVideo(selectedPhotos[0])) {
                return <Image
                    source={{ uri: selectedPhotos[0].uri }}
                    style={styles.selectedImage}
                />;
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

        return (
            <FlatList
                data={selectedPhotos}
                horizontal
                pagingEnabled
                ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ index, item }) => {
                    if (isVideo(item)) {
                        // return <CustomVideo video={item} key={index} />;
                        return <Image
                            source={{ uri: item.uri }}
                            style={styles.selectedImage}
                        />;
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
            setLoading(false);
            onComplete({
                media: selectedPhotos,
                caption,
                location: null,
                taggedEntities,
            });
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
            <KeyboardAccessoryView alwaysVisible={true} hideBorder={true} androidAdjustResize>
                <ScrollView contentContainerStyle={styles.scrollView}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
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
                            // backgroundColor: '#151617',
                            height: 350,
                            padding: 10,
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
                    </KeyboardAvoidingView>
                    <Collapsible />
                </ScrollView>

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
                )
                }


                {/* ERROR */}
                {
                    (error && !loading) && (
                        <View style={[styles.errorMessage]}>
                            <Text />
                            <Text style={{ color: 'red', fontFamily: 'Poppins_500Medium', textAlign: 'center', maxWidth: 300 }}>{error}</Text>
                            <TouchableOpacity onPress={() => setError(null)}>
                                <Ionicons name="close" size={16} color="red" />
                            </TouchableOpacity>
                        </View>
                    )
                }

                {/* Share Button */}
                <TouchableOpacity style={styles.shareButton} onPress={onShare}>
                    <Text style={styles.shareButtonText}>Post Now</Text>
                </TouchableOpacity>
            </KeyboardAccessoryView>

        </SafeAreaView >
    );
};

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
        height: 100,
        paddingHorizontal: 15,
        fontFamily: 'Poppins_500Medium',
    },
    selectedImage: {
        width: 350,
        height: '100%',
        borderRadius: 15,
        // resizeMode: 'contain',
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
