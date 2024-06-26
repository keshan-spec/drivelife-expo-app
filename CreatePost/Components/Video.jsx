import { useEffect, useState } from "react";
import { Dimensions, View } from "react-native";
import { StyleSheet } from "react-native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

const screenWidth = Dimensions.get('window').width;
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePostProvider } from "../ContextProvider";

import { Video } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';

const CustomVideo = ({ video }) => {
    const { step } = usePostProvider();
    const [paused, setPaused] = useState(false);

    const [media, setMedia] = useState({
        uri: null,
    });

    useEffect(() => {
        const loadVideo = async () => {
            const asset = await MediaLibrary.getAssetInfoAsync(video.id);
            setMedia(asset);
        };

        loadVideo();
    }, [video]);


    useEffect(() => {
        console.log('step', step);
        setPaused(step === 1);
    }, [step]);

    const togglePaused = () => {
        setPaused((prevPaused) => !prevPaused);
    };

    return (
        <TouchableWithoutFeedback onPress={togglePaused} style={{ width: '100%', height: '100%' }}>
            {paused && (
                <>
                    <MaterialCommunityIcons name="play"
                        size={50} color="white"
                        style={{ position: 'absolute', zIndex: 1, top: '50%', left: '50%', transform: [{ translateX: -25 }, { translateY: -25 }] }}
                    />

                    <View style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.1)', zIndex: 2 }} />
                </>
            )}

            {media.uri && (
                <Video
                    key={media.uri}
                    resizeMode="contain"
                    source={{ uri: media.uri }}
                    style={styles.selectedImage}
                    shouldPlay={!paused}
                    isLooping
                />
            )}
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    selectedImage: {
        width: screenWidth,
        height: '100%',
        resizeMode: 'cover',
    },

});

export default CustomVideo;