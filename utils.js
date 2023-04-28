import { PermissionsAndroid } from 'react-native';
import { Permissions } from 'expo-permissions';

export async function setExpoTokenInWP(token) {
    // send request to server to save token
    let url = 'https://www.carcalendar.co.uk/wp-json/expoapi/v1/expo_update_push_token';
    let data = {
        deviceId: 22,
        token: token,
    };

    let response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })

    let json = await response.json();
    console.log(`Response from server: ${json}`);
}

export async function getExternalUIDInWP(carcalSession) {
    // send request to server to save token
    let url = 'https://staging1.carcalendar.co.uk/wp-json/expoapi/v1/get_external_uid';
    let data = {
        token: carcalSession,
    };

    let response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })

    let json = await response.json();
    // format the external user id
    // remove ""
    id = json.replace(/"/g, '');
    // remove spaces
    id = id.replace(/\s/g, '');
    return id;
}

export async function maybeSetUserLocation(coords, uid) {
    // send request to server to save token
    let url = 'https://staging1.carcalendar.co.uk/wp-json/expoapi/v1/set_user_location';
    let data = {
        coords: coords,
        user_id: uid
    };

    let response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })

    let json = await response.json();
    return json;
}

export async function GetAllPermissions() {
    try {
        if (Platform.OS === "android") {
            const userResponse = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            ]);
            return userResponse;
        }
    } catch (err) {
        Warning(err);
    }
    return null;
}