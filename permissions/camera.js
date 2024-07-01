
import { Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';

export const checkCameraPermission = async () => {
    const result = await check(PERMISSIONS.ANDROID.CAMERA); // Use PERMISSIONS.IOS.CAMERA for iOS

    switch (result) {
        case RESULTS.UNAVAILABLE:
            return false;
        case RESULTS.DENIED:
            return await requestCameraPermission();
        case RESULTS.LIMITED:
        case RESULTS.GRANTED:
            return true;
        case RESULTS.BLOCKED:
            showSettingsAlert();
            break;
    }
};

export const requestCameraPermission = async () => {
    const permissionType = Platform.OS === "android" ? PERMISSIONS.ANDROID.CAMERA : PERMISSIONS.IOS.CAMERA;
    const result = await request(permissionType);
    if (result === RESULTS.GRANTED) {
        return true;
    } else {
        showSettingsAlert();
    }
};

export const showSettingsAlert = ({
    title = 'Camera Permission',
    message = 'Camera access is required to take pictures. Please enable it in the settings.',
    cancelText = 'Cancel',
    openSettingsText = 'Open Settings',
}) => {
    Alert.alert(
        title,
        message,
        [
            { text: cancelText, style: 'cancel' },
            { text: openSettingsText, onPress: () => openSettings() }
        ]
    );
};

export const checkStoragePermission = async () => {
    const permissionType = Platform.OS === "android" ? PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE : PERMISSIONS.IOS.MEDIA_LIBRARY;

    const result = await check(permissionType);

    switch (result) {
        case RESULTS.UNAVAILABLE:
            return false;
        case RESULTS.DENIED:
            return await requestStoragePermission();
        case RESULTS.LIMITED:
        case RESULTS.GRANTED:
            return true;
        case RESULTS.BLOCKED:
            showSettingsAlert();
            break;
    }
};

export const requestStoragePermission = async () => {
    const permissionType = Platform.OS === "android" ? PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE : PERMISSIONS.IOS.MEDIA_LIBRARY;
    const result = await request(permissionType);

    if (result === RESULTS.GRANTED) {
        return true;
    } else {
        showSettingsAlert();
    }
};