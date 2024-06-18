// import React, { useState } from 'react';
// import * as ImageManipulator from "expo-image-manipulator";
// import { Button, Dimensions, Image, Text, View } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';

// const screenWidth = Dimensions.get('window').width;

// export const EditImage = ({ selectedImage, onUpdate, onCancel }) => {
//     const [image, setSelectedImage] = useState(null);

//     const pickImage = async () => {
//         try {
//             const result = await ImagePicker.launchImageLibraryAsync({
//                 mediaTypes: ImagePicker.MediaTypeOptions.Images,
//                 allowsEditing: true,
//                 aspect: [1, 1],
//                 quality: 1,
//             });

//             if (!result.cancelled) {
//                 setSelectedImage(result);
//                 console.log("Image picked successfully!");
//             } else {
//                 console.log("Image selection cancelled.");
//             }
//         } catch (error) {
//             console.log("Error picking image:", error);
//         }
//     };

//     const editAndResizeImage = async () => {
//         try {
//             if (image && image.uri) {
//                 const resizedImage = await ImageManipulator.manipulateAsync(
//                     selectedImage.uri,
//                     [{ resize: { width: 500, height: 500 } }],
//                     { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
//                 );

//                 if (resizedImage && resizedImage.uri) {
//                     onUpdate({
//                         width: resizedImage.width,
//                         height: resizedImage.height,
//                     });
//                     console.log("Image successfully cropped!");
//                 } else {
//                     console.log("Error resizing image");
//                 }
//             } else {
//                 console.log("No selected image to resize");
//             }
//         } catch (error) {
//             console.log("Error during image manipulation:", error);
//         }
//     };

//     console.log("Selected Image", image);

//     return (
//         <View
//             style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
//         >
//             {image && image.uri && (
//                 <Image
//                     source={{ uri: image.uri }}
//                     style={{
//                         width: screenWidth,
//                         height: '100%',
//                         resizeMode: 'contain',
//                     }}
//                 />
//             )}

//             <Button title="Pick Image" onPress={pickImage} />
//             <Button title="Edit Image" onPress={editAndResizeImage} />
//             <Button title="Cancel" onPress={onCancel} />
//         </View>
//     );
// };

import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Dimensions, ImageBackground, Image, Button } from 'react-native';
import { ImageManipulator } from 'expo-image-crop';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { ImageEditor } from "expo-image-editor";

const { width, height } = Dimensions.get('window');

const EditImage = ({ imageUri, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [editorVisible, setEditorVisible] = useState(false);
    const [imageData, setImageData] = useState({ uri: imageUri });

    const handleCrop = async (cropRegion) => {
        setLoading(true);
        console.log("Cropping Image", cropRegion);
        try {
            const manipResult = await manipulateAsync(
                imageUri,
                [{ crop: cropRegion }],
                { compress: 1, format: SaveFormat.JPEG }
            );

            onSave(manipResult.uri);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const launchEditor = (uri) => {
        // And set the image editor to be visible
        setEditorVisible(true);
    };

    return (
        <View>
            <Image
                style={{ height: 300, width: 300 }}
                source={{ uri: imageData.uri }}
            />
            <Button title="Select Photo" onPress={() => selectPhoto()} />
            {/* <ImageEditor
                visible={editorVisible}
                onCloseEditor={() => setEditorVisible(false)}
                imageUri={imageUri}
                fixedCropAspectRatio={16 / 9}
                lockAspectRatio={aspectLock}
                minimumCropDimensions={{
                    width: 100,
                    height: 100,
                }}
                onEditingComplete={(result) => {
                    setImageData(result);
                }}
                mode="full"
            /> */}
        </View>
    );

    return (
        <View style={styles.container}>
            <ImageZoom cropWidth={Dimensions.get('window').width}
                cropHeight={Dimensions.get('window').height}
                imageWidth={500}
                imageHeight={500}
            >
                <Image
                    style={{ width: 500, height: 800 }}
                    source={{ uri: imageUri }}
                />
            </ImageZoom>

            {/* <ImageBackground
                resizeMode="contain"
                style={{
                    justifyContent: 'center', padding: 20, alignItems: 'center', height, width, backgroundColor: 'black',
                }}
                source={{ imageUri }}
            >
                <ImageManipulator
                    photo={{ imageUri }}
                    isVisible
                    onPictureChoosed={({ uri: uriM }) => {
                        console.log("Picture Choosed", uriM);
                    }}
                    onToggleModal={() => {
                        console.log("Modal Toggled");
                        onSave(imageUri);
                    }}
                />
            </ImageBackground> */}

            {/* {(!loading && imageUri !== null) && (
                <ImageBackground
                    resizeMode="contain"
                    style={{
                        justifyContent: 'center', alignItems: 'center', height, width, backgroundColor: 'black'
                    }}
                    source={{ imageUri }}
                >
                    <ImageManipulator
                        onToggleModal={() => {
                            console.log("Modal Toggled");
                            onSave(imageUri);
                        }}
                        photo={{ uri: imageUri }}
                        isVisible
                        onPictureChoosed={handleCrop}
                        saveOptions={{
                            compress: 1,
                            format: 'jpeg',
                            base64: false,
                        }}
                        allowFlip={false}
                        allowRotate={false}
                        fixedMask={{
                            width: 350,
                            height: 350,
                        }}
                    // btnTexts={{
                    //     crop: 'Crop',
                    //     // rotate: 'Rotate',
                    //     done: 'Done',
                    //     processing: 'Processing',
                    // }}
                    />
                </ImageBackground>
            )} */}
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#000',
        // justifyContent: 'center',
        // alignItems: 'center',
    },
    loading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
});

export default EditImage;
