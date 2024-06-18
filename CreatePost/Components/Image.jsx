import React, { useRef, useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, Animated, PanResponder, TouchableOpacity, Text } from 'react-native';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const VIEW_SIZE = 600;  // Instagram post size

const CustomImage = ({ image, onImageChange }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const lastTranslateY = useRef(0);
    const maxTranslateY = useRef(0);

    // useEffect(() => {
    //     const listener = scale.addListener(({ value }) => {
    //         if (value < 1) {
    //             scale.setValue(1);
    //         }
    //     });

    //     return () => {
    //         scale.removeListener(listener);
    //     };
    // }, [scale]);

    const handlePinch = Animated.event([{ nativeEvent: { scale } }], { useNativeDriver: true });

    const handlePinchStateChange = ({ nativeEvent }) => {
        if (nativeEvent.state === State.END) {
            lastScale.current *= nativeEvent.scale;
            if (lastScale.current < 1) {
                lastScale.current = 1;
                Animated.spring(scale, {
                    toValue: 1,
                    useNativeDriver: true,
                }).start();
            }
        }
    };

    const panResponder = useRef(PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (evt, gestureState) => {
            let newTranslateY = lastTranslateY.current + gestureState.dy;

            // Clamp the translateY value to the maxTranslateY
            if (newTranslateY > maxTranslateY.current) {
                newTranslateY = maxTranslateY.current;
            } else if (newTranslateY < -maxTranslateY.current) {
                newTranslateY = -maxTranslateY.current;
            }

            translateY.setValue(newTranslateY);

        },
        onPanResponderRelease: (evt, gestureState) => {
            lastTranslateY.current = translateY._value;
            // Check if the translateY value is out of bounds
            if (lastTranslateY.current > maxTranslateY.current || lastTranslateY.current < -maxTranslateY.current) {
                Animated.spring(translateY, {
                    toValue: lastTranslateY.current > maxTranslateY.current ? maxTranslateY.current : -maxTranslateY.current,
                    useNativeDriver: true,
                }).start(() => {
                    lastTranslateY.current = translateY._value;
                });
            } else {
                lastTranslateY.current = lastTranslateY.current;
            }

            onImageChange({
                ...image,
                translateY: lastTranslateY.current,
            });
        },
    })
    ).current;

    const onImageLayout = (event) => {
        const { height: imgHeight, width: imgWidth } = event.nativeEvent.layout;
        const scaleFactor = VIEW_SIZE / Math.min(imgWidth, imgHeight);
        const scaledImgHeight = imgHeight * scaleFactor;

        maxTranslateY.current = (scaledImgHeight - VIEW_SIZE) / 4;
    };

    const fitToScreen = () => {
        // stretch the image to fit the screen
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
        }).start();

        // center the image
        Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
        }).start();
    };

    return (
        <View style={styles.container}>
            <View style={styles.imageContainer}>
                <PinchGestureHandler
                    onGestureEvent={handlePinch}
                    onHandlerStateChange={handlePinchStateChange}
                >
                    <Animated.View
                        style={{ transform: [{ scale }, { translateY }] }}
                        {...panResponder.panHandlers}
                    >
                        <Image
                            key={image.uri}
                            source={{ uri: image.uri }}
                            style={styles.selectedImage}
                            onLayout={onImageLayout}
                        />
                    </Animated.View>
                </PinchGestureHandler>
            </View>
            <TouchableOpacity style={styles.fitButton} onPress={fitToScreen}>
                <Text style={styles.fitButtonText}>Fit to Screen</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        width: screenWidth,
        height: VIEW_SIZE,
        overflow: 'hidden',
    },
    selectedImage: {
        width: screenWidth,
        height: '100%',
        resizeMode: 'contain',
    },
    fitButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 5,
    },
    fitButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default CustomImage;
