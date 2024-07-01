import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';

import { ImageEditor } from "expo-image-editor";
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface EditImageProps {
    image: {
        uri: string;
        width: number;
        height: number;
        originalUri?: string;
    };
    onSave: (image: any) => void;
    onCancel: () => void;
    aspectLock?: boolean;
    aspectRatio?: number;
}

const EditImage = ({
    image,
    onSave,
    onCancel,
    aspectLock = false,
    aspectRatio = 0,
}: EditImageProps) => {
    return (
        <SafeAreaView style={styles.container}>
            <ImageEditor
                visible={true}
                onCloseEditor={() => {
                    onCancel();
                }}
                imageUri={image.originalUri || image.uri}
                fixedCropAspectRatio={aspectRatio || undefined}
                lockAspectRatio={aspectLock}
                onEditingComplete={(result) => {
                    onSave({
                        ...image,
                        originalUri: image.originalUri || image.uri,
                        uri: result.uri,
                        width: result.width,
                        height: result.height,
                    });
                }}
                asView
                mode="crop-only"
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: height,
        width: width,
    },
    poppinsFont: {
        fontFamily: 'Poppins_500Medium',
    },
    headerText: {
        fontSize: 16,
        color: 'black',
        textAlign: 'center',
        marginLeft: 5,
    },
    shareButton: {
        backgroundColor: '#ae9159',
        padding: 8,
        alignItems: 'center',
        borderRadius: 8,
        // width: '50%',
    },
    shareButtonText: {
        fontSize: 16,
        color: '#fff',
        fontFamily: 'Poppins_500Medium',
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
