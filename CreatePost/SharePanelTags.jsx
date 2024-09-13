import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, TouchableWithoutFeedback, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { usePostProvider } from './ContextProvider';

import { Ionicons } from '@expo/vector-icons';
import Collapsible from './Collapsible';
import { useCallback, useMemo, useState } from 'react';

const SharePostTagPanel = ({ navigation, onComplete }) => {
    const { selectedPhotos, setStep, taggedEntities, updateSelectedImage, caption } = usePostProvider();
    const [error, setError] = useState(null);

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
                <Image
                    source={{ uri: selectedPhotos[0].uri }}
                    style={styles.selectedImage}
                />
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
                        <Image
                            source={{ uri: item.uri }}
                            style={styles.selectedImage}
                        />
                    );
                }}
            />
        );
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

                <Collapsible />
            </ScrollView>

            {/* ERROR */}
            {(error) && (
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F9',
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

export default SharePostTagPanel;
