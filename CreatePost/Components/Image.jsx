// import ImageSize from 'react-native-image-size';

import React, { useCallback, useEffect, useState } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { StyleSheet, Dimensions, Button } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { usePostProvider } from '../ContextProvider';

const { width, height } = Dimensions.get('window');

const getImageSize = async (source) => {
    try {
        let imageWidth = source.width;
        let imageHeight = source.height;

        // const { width, height } = await ImageSize.getSize(source.uri);

        // if (!imageWidth) {
        //     imageWidth = width;
        // }

        // if (!imageHeight) {
        //     imageHeight = height;
        // }

        return {
            width: imageWidth,
            height: imageHeight
        };
    } catch (error) {
        console.error(error);
        return {
            width: 0,
            height: 0
        };
    }
};

function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

export default function PannableImage({ image }) {
    const translationX = useSharedValue(0);
    const translationY = useSharedValue(0);
    const prevTranslationX = useSharedValue(0);
    const prevTranslationY = useSharedValue(0);
    const scale = useSharedValue(1);
    const startScale = useSharedValue(0);

    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [layout, setLayout] = useState({ width: 0, height: 0 });

    const [updatedImage, setUpdatedImage] = useState(image);
    const { selectedPhotos, setSelectedPhotos } = usePostProvider();


    useEffect(() => {
        getImageSize(image).then((size) => {
            setImageSize(size);

            setUpdatedImage({
                ...image,
                width: size.width,
                height: size.height
            });
        });
    }, []);


    const manipulateImage = useCallback(async () => {
        try {
            const { width, height } = imageSize;
            const { uri } = image;

            // scaled and panned image
            // image starts at translationX, translationY
            // image is scaled by scale

            // Calculate the new starting point (originX, originY)
            const scaledTranslationX = translationX.value / scale.value;
            const scaledTranslationY = translationY.value / scale.value;

            // Calculate the new width and height based on the current scale
            const newWidth = width / scale.value;
            const newHeight = height / scale.value;

            // Ensure the origin points are within bounds
            const x = Math.min(Math.max(scaledTranslationX, 0), width - newWidth);
            const y = Math.min(Math.max(scaledTranslationY, 0), height - newHeight);

            console.log("newWidth", newWidth, "newHeight", newHeight, "x", x, "y", y);

            const manipulator = await ImageManipulator.manipulateAsync(
                uri,
                [
                    {
                        crop: {
                            originX: x,
                            originY: y,
                            width: newWidth,
                            height: newHeight,
                        },
                    },
                ],
                { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
            );

            console.log("manipulator", manipulator);

            setUpdatedImage({
                ...updatedImage,
                uri: manipulator.uri,
            });
            scale.value = 1;
            translationX.value = 0;
            translationY.value = 0;

        } catch (error) {
            console.error(error);
        }
    }, [imageSize, image, translationX, translationY, scale, selectedPhotos]);



    const animatedStyles = useAnimatedStyle(() => ({
        transform: [
            { translateX: translationX.value },
            { translateY: translationY.value },
            { scale: scale.value }
        ],
    }));

    const pan = Gesture.Pan()
        .minDistance(1)
        .onStart(() => {
            prevTranslationX.value = translationX.value;
            prevTranslationY.value = translationY.value;
        })
        .onEnd(() => {
            translationX.value = withSpring(translationX.value);
            translationY.value = withSpring(translationY.value);

            prevTranslationX.value = translationX.value;
            prevTranslationY.value = translationY.value;
        })
        .onUpdate((event) => {
            const { translationX: dX, translationY: dY } = event;

            // Calculate the image dimensions after scaling
            const scaledWidth = (imageSize.width * scale.value);
            const scaledHeight = (imageSize.height * scale.value);

            const divisorY = (scaledHeight / layout.height);
            const divisorX = (scaledWidth / layout.width);

            const maxTranslateX = (layout.width / divisorX);
            const maxTranslateY = (layout.height / divisorY);

            translationX.value = clamp(
                prevTranslationX.value + dX,
                -maxTranslateX,
                maxTranslateX
            );

            translationY.value = clamp(
                prevTranslationY.value + dY,
                -maxTranslateY,
                maxTranslateY
            );
        })
        .runOnJS(true);

    const pinch = Gesture.Pinch()
        .onStart(() => {
            startScale.value = scale.value;
        })
        .onEnd(() => {
            scale.value = withSpring(scale.value);
            startScale.value = scale.value;

        })
        .onUpdate((event) => {
            const maxScale = Math.min(layout.width / 100, layout.height / 100);

            scale.value = clamp(
                startScale.value * event.scale,
                1,
                maxScale
            );
        })
        .runOnJS(true);

    const composed = Gesture.Simultaneous(pinch, pan);

    return (
        <GestureHandlerRootView
            style={[styles.container]}
            onLayout={({ nativeEvent }) => {
                setLayout(nativeEvent.layout);
            }}
        >
            <GestureDetector gesture={composed}>
                <Animated.Image
                    source={{ uri: updatedImage.uri }}
                    style={[animatedStyles, styles.box]}
                />
            </GestureDetector>
            {/* <Button title="Save" onPress={manipulateImage} /> */}
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 500,
        height: 400,
        backgroundColor: 'gray',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        flex: 1,
    },
    box: {
        width: "100%",
        height: "100%",
        resizeMode: 'contain',
        position: 'absolute',
        transform: [{ scale: 2 }],
    },
});