import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { usePostProvider } from './ContextProvider';

import { Ionicons } from '@expo/vector-icons';
import Collapsible from './Collapsible';
import { addPost, addTagsForPost } from './actions/create-post';
import { useState } from 'react';
import EditImage from './Components/EditImage';

const SharePost = ({ navigation, onComplete }) => {
    const { selectedPhotos, setStep, getImageMetaData, taggedEntities } = usePostProvider();
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editImage, setEditImage] = useState(null);

    const renderSelectedPhotos = () => {
        if (selectedPhotos.length === 0) {
            return (
                <TouchableOpacity onPress={() => setEditImage(selectedPhotos[0])}>
                    <Image
                        source={{ uri: selectedPhotos[0].uri }}
                        style={styles.selectedImage}
                    />
                </TouchableOpacity>
            );
        }

        return (
            <FlatList
                data={selectedPhotos}
                horizontal
                pagingEnabled
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => setEditImage(item)}>
                        <Image
                            source={{ uri: item.uri }}
                            style={styles.selectedImage}
                        />
                    </TouchableOpacity>
                )}
            />
        );
    };

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
            setError('An error occurred while sharing your post. Please try again later.');
            setLoading(false);
        }
    };

    if (editImage) {
        return (
            <EditImage
                imageUri={editImage.uri}
                onSave={(data) => {
                    console.log("Updated Image Data", data);
                    setEditImage(null);
                }}
            // onCancel={() => setEditImage(null)}
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
