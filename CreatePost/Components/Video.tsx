import React, { useEffect, useState, memo } from "react";
import { Dimensions, View } from "react-native";
import { StyleSheet } from "react-native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePostProvider } from "../ContextProvider";

import { ResizeMode, Video } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';

const screenWidth = Dimensions.get('window').width;


interface CustomVideoProps {
    video: {
        uri: string;
        id: string;
    };
}

const CustomVideo = ({ video }: CustomVideoProps) => {
    const { step } = usePostProvider();
    const [paused, setPaused] = useState(false);

    const [media, setMedia] = useState<MediaLibrary.AssetInfo | null>(null);

    useEffect(() => {
        const loadVideo = async () => {
            // check if the video is already in the media library
            const asset = await MediaLibrary.getAssetInfoAsync(video.id);
            setMedia(asset);
        };

        loadVideo();
    }, [video]);


    useEffect(() => {
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

            {media && (
                <Video
                    key={media.uri}
                    resizeMode={ResizeMode.CONTAIN}
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

export default memo(CustomVideo);