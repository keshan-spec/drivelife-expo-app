import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, TouchableWithoutFeedback, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { usePostProvider } from './ContextProvider';

import { Ionicons } from '@expo/vector-icons';
import Collapsible from './Collapsible';
import { useCallback, useMemo, useState } from 'react';
import EditImage from './Components/EditImage';

const SharePostStep1 = ({ navigation, onComplete }) => {
    const { selectedPhotos, setStep, taggedEntities, updateSelectedImage, caption, setCaption } = usePostProvider();
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

                    <TouchableOpacity onPress={() => {
                        navigation.navigate('SharePanelTags');
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
                            </Text>
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
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
        // height: Dimensions.get('window').height,
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
        width: 350,
        height: '100%',
        borderRadius: 15,
        // resizeMode: 'contain',
    },
    scrollView: {
        // padding: 16,
        // height: '100%',
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
