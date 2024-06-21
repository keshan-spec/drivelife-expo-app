import ImageSize from 'react-native-image-size';

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

        const { width, height } = await ImageSize.getSize(source.uri);

        if (!imageWidth) {
            imageWidth = width;
        }

        if (!imageHeight) {
            imageHeight = height;
        }

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


// const PannableImage = ({ image }) => {
//     const [scaleX, setScale] = useState(1);
//     const [loaded, setLoaded] = useState(false);

//     const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;


//     const [fitToScale, setFitToScale] = useState(false);

//     const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
//     const [imageBounds, setImageBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });
//     const [imageScaleFactor, setImageScaleFactor] = useState(1);
//     const [imageLayout, setImageLayout] = useState({ height: 0, width: 0 });

//     useEffect(() => {
//         getImageSize(image).then((size) => {
//             setImageSize(size);
//             let scale = Math.floor(Math.max(width / size.width, height / size.height) * 3);
//             if (scale < 1) scale = 1;
//             setScale(1);
//             setLoaded(true);
//         });
//     }, []);

//     const panResponder = PanResponder.create({
//         onStartShouldSetPanResponder: () => true,
//         onMoveShouldSetPanResponder: () => true,
//         onPanResponderGrant: () => {
//             position.extractOffset();
//         },
//         onPanResponderMove: Animated.event(
//             [null, { dx: position.x, dy: position.y }],
//             { useNativeDriver: false }
//         ),
//         onPanResponderRelease: (evt, gestureState) => {
//             const { dx, dy } = gestureState;

//             // Calculate the image dimensions after scaling
//             const scaledWidth = imageSize.width * scale;
//             const scaledHeight = imageSize.height * scale;

//             // Calculate the boundary limits for the image to stay within the container
//             const xBound = Math.max((scaledWidth - width) / 2, 0);  // Half the overflow on each side
//             const yBound = Math.max((scaledHeight - height) / 2, 0); // Half the overflow on each side

//             // Calculate the new position, ensuring the image can move freely
//             let newX = Math.min(Math.max(-xBound, position.x._value), xBound);
//             let newY = Math.min(Math.max(-yBound, position.y._value), yBound);

//             // Animate to the new position
// Animated.spring(position, {
//     toValue: { x: newX, y: newY },
//     useNativeDriver: false,
// }).start();
//         },
//     });

//     const getImageFrame = (layout) => {
//         onUpdateCropLayout(layout);
//     };

//     const onUpdateCropLayout = (layout) => {
//         // Check layout is not null
//         if (layout) {
//             // Find the start point of the photo on the screen and its
//             // width / height from there
//             const editingWindowAspectRatio = layout.height / layout.width;
//             //
//             const imageAspectRatio = imageSize.height / imageSize.width;
//             let bounds = { x: 0, y: 0, width: 0, height: 0 };
//             let imageScaleFactor = 1;
//             // Check which is larger
//             if (imageAspectRatio > editingWindowAspectRatio) {
//                 // Then x is non-zero, y is zero; calculate x...
//                 bounds.x =
//                     (((imageAspectRatio - editingWindowAspectRatio) / imageAspectRatio) *
//                         layout.width) /
//                     2;
//                 bounds.width = layout.height / imageAspectRatio;
//                 bounds.height = layout.height;
//                 imageScaleFactor = imageSize.height / layout.height;
//             } else {
//                 // Then y is non-zero, x is zero; calculate y...
//                 bounds.y =
//                     (((1 / imageAspectRatio - 1 / editingWindowAspectRatio) /
//                         (1 / imageAspectRatio)) *
//                         layout.height) /
//                     2;
//                 bounds.width = layout.width;
//                 bounds.height = layout.width * imageAspectRatio;
//                 imageScaleFactor = imageSize.width / layout.width;
//             }

//             setImageBounds(bounds);
//             setImageScaleFactor(imageScaleFactor);
//             setImageLayout({
//                 height: layout.height,
//                 width: layout.width,
//             });
//         }
//     };

//     const scale = useSharedValue(1);
//     const focalX = useSharedValue(0);
//     const focalY = useSharedValue(0);

//     const pinchHandler =
//         useAnimatedGestureHandler({
//             onActive: (event) => {
//                 scale.value = event.scale;
//                 focalX.value = event.focalX;
//                 focalY.value = event.focalY;
//             },
//             onEnd: () => {
//                 scale.value = withTiming(1);
//             },
//         });

//     const rStyle = useAnimatedStyle(() => {
//         return {
//             transform: [
//                 { translateX: focalX.value },
//                 { translateY: focalY.value },
//                 { translateX: -width / 2 },
//                 { translateY: -height / 2 },
//                 { scale: scale.value },
//                 { translateX: -focalX.value },
//                 { translateY: -focalY.value },
//                 { translateX: width / 2 },
//                 { translateY: height / 2 },
//             ],
//         };
//     });

//     const focalPointStyle = useAnimatedStyle(() => {
//         return {
//             transform: [{ translateX: focalX.value }, { translateY: focalY.value }],
//         };
//     });

//     if (!loaded) {
//         return <View style={styles.container} />;
//     }

//     return (
//         <PinchGestureHandler onGestureEvent={pinchHandler}>
//             <Animated.View style={{ flex: 1 }}>
//                 <AnimatedImage
//                     style={[{ flex: 1, width: 300 }, rStyle]}
//                     source={{ uri: image.uri }}
//                 />
//                 <Animated.View style={[styles.focalPoint, focalPointStyle]} />
//             </Animated.View>
//         </PinchGestureHandler>
//     );

//     return (
//         <View style={styles.container}>
//             <View style={[styles.imageContainer,
//             { width: width, height: height, }
//             ]}>
//                 <Animated.Image
//                     source={{ uri: image.uri }}
//                     style={[
//                         styles.image,
//                         {
//                             transform: [
//                                 { translateX: position.x },
//                                 { translateY: position.y },
//                                 { scale: scale },
//                             ],
//                         },
//                     ]}
//                     {...panResponder.panHandlers}
//                     onLayout={({ nativeEvent }) => getImageFrame(nativeEvent.layout)}
//                 />
//             </View>

//             {/* fit to scale button */}
//             <TouchableOpacity
//                 onPress={() => {
//                     let fitBy = 1;
//                     if (!fitToScale) {
//                         const fitByWidth = width / imageSize.width;
//                         const fitByHeight = height / imageSize.height;
//                         fitBy = 1;
//                     } else {
//                         fitBy = Math.floor(Math.max(width / imageSize.width, height / imageSize.height) * 3);
//                         if (fitBy < 1) fitBy = 1;
//                     }

//                     setScale(fitBy);
//                     setFitToScale(!fitToScale);
//                     position.setValue({ x: 0, y: 0 });
//                 }}
//                 style={styles.fitButton}
//             >
//                 <Ionicons name="expand-outline" size={18} color="white" />
//             </TouchableOpacity>
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     focalPoint: {
//         ...StyleSheet.absoluteFillObject,
//         width: 20,
//         height: 20,
//         backgroundColor: 'blue',
//         borderRadius: 10,
//     },
//     fitButton: {
//         position: 'absolute',
//         bottom: 10,
//         left: 10,
//         width: 40,
//         height: 40,
//         backgroundColor: 'rgba(0, 0, 0, 0.5)',
//         borderRadius: 9999,
//         justifyContent: 'center',
//         alignItems: 'center',
//         zIndex: 999,
//     },
//     container: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         position: 'relative',
//         backgroundColor: '#f0f0f0',
//         width: width,
//         backgroundColor: 'gray',
//         overflow: 'hidden',
//     },
//     imageContainer: {
//         flex: 1,
//         overflow: 'hidden',
//         backgroundColor: 'white',
//     },
//     image: {
//         // width: width,
//         // height: height,
//         // width: "100%",
//         // height: "100%",
//         flex: 1,
//         resizeMode: 'contain',
//     },
// });

// export default PannableImage;

