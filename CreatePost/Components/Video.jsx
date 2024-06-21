import { useEffect, useState } from "react";
import { Dimensions, View } from "react-native";
import { StyleSheet } from "react-native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import Video from "react-native-video";

const screenWidth = Dimensions.get('window').width;
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePostProvider } from "../ContextProvider";

const CustomVideo = ({ video }) => {
    const { step } = usePostProvider();
    const [paused, setPaused] = useState(false);

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

            <Video
                key={video.uri}
                source={{ uri: video.uri }}
                style={styles.selectedImage}
                resizeMode="contain"
                paused={paused}
                repeat={true}
                playInBackground={false}
                playWhenInactive={false}
            />
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