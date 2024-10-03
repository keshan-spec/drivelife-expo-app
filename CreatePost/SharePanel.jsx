import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, TouchableWithoutFeedback, FlatList, Dimensions, ActivityIndicator, KeyboardAvoidingView, Keyboard } from 'react-native';
import { usePostProvider } from './ContextProvider';

import { Ionicons } from '@expo/vector-icons';
import Collapsible from './Collapsible';
import { useCallback, useMemo, useState } from 'react';
import EditImage from './Components/EditImage';
import { KeyboardAccessoryNavigation, KeyboardAccessoryView } from 'react-native-keyboard-accessory'
import { useKeyboardVisible } from '../hooks/useKeyboardVisible';


const SharePostStep1 = ({ navigation, onComplete }) => {
    const { selectedPhotos, setStep, taggedEntities, updateSelectedImage, caption, setCaption } = usePostProvider();
    const [error, setError] = useState(null);
    const [editImageIdx, setEditImageIdx] = useState(null);

    const { isKeyboardVisible } = useKeyboardVisible()

    const isVideo = (media) => media.type.startsWith('video') ? true : false;

    const renderSelectedPhotos = useCallback(() => {
        if (selectedPhotos.length === 1) {
            const uri = selectedPhotos[0].isPicker ? selectedPhotos[0].localUri : selectedPhotos[0].uri;

            return (
                <TouchableWithoutFeedback onPress={() => setEditImageIdx(0)} style={{ flex: 1 }}>
                    <Image
                        source={{ uri }}
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
        try {
            onComplete({
                media: selectedPhotos,
                caption,
                location: null,
                taggedEntities,
            });
        } catch (error) {
            console.log('Error sharing post:', error);
            setError('An error occurred while sharing your post. Please try again later.');
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
                        // navigation.navigate('ImageSelection');
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
                    <TouchableOpacity onPress={() => {
                        navigation.navigate('SharePostTag');
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                            <Text style={[styles.headerText, styles.poppinsFont, {
                                color: '#ae9159',
                                marginRight: 5,
                            }]}>
                                Next
                                {' '}
                            </Text>
                            {/* <Ionicons name="chevron-forward" size={20} color="black" /> */}
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{
                    // flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    // backgroundColor: '#151617',
                    height: 350,
                    padding: 10,
                    marginBottom: isKeyboardVisible ? 190 : 0,
                }}>
                    {renderSelectedPhotos()}
                </View>

                <KeyboardAccessoryView alwaysVisible={true}
                    inSafeAreaView
                    // heightProperty='minHeight'
                    style={{
                        flex: 1,
                        backgroundColor: '#F9F9F9',
                        // height: 100
                    }}>
                    <View style={styles.textAreaContainer}>
                        <TextInput
                            defaultValue={caption}
                            onChangeText={setCaption}
                            multiline={true}
                            numberOfLines={5}
                            textBreakStrategy='balanced'
                            scrollEnabled={true}
                            style={styles.captionInput}
                            placeholder="Write a caption..."
                            placeholderTextColor="#aaa"
                        />
                    </View>

                </KeyboardAccessoryView>
            </ScrollView>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
        minHeight: Dimensions.get('window').height,
        height: Dimensions.get('window').height,
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
        padding: 5,
        backgroundColor: '#F9F9F9',
        height: Dimensions.get('window').height / 2,
    },
    captionInput: {
        marginTop: 10,
        justifyContent: "flex-start",
        textAlignVertical: 'top',
        maxHeight: 100,
        height: 100,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        fontFamily: 'Poppins_500Medium',
    },
    selectedImage: {
        width: 350,
        height: '100%',
        borderRadius: 15,
        // resizeMode: 'contain',
        // flex: 1,
    },
    scrollView: {
        // paddingHorizontal: 16,
        // height: Dimensions.get('window').height,
        height: '100%',
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

export default SharePostStep1;
