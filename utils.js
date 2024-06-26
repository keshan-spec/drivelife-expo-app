import { PermissionsAndroid } from 'react-native';

import { } from 'react-native-permissions';
export const URL = 'https://www.carevents.com';

export async function setExpoTokenInWP(token) {
    // send request to server to save token
    let url = `${URL}/wp-json/expoapi/v1/expo_update_push_token`;
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
    });

    let json = await response.json();
    console.log(`Response from server: ${json}`);
}

export async function getExternalUIDInWP(carcalSession) {
    // send request to server to save token
    try {
        let url = `${URL}/wp-json/expoapi/v1/get_external_uid`;
        let data = {
            token: carcalSession,
        };

        let response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        let json = await response.json();
        // format the external user id
        // remove ""
        id = json.replace(/"/g, '');
        // remove spaces
        id = id.replace(/\s/g, '');
        return id;
    } catch (err) {
        console.log(err);
        return null;
    }
}

export async function loginUserinWP(user_id) {
    // send request to server to save token
    try {
        let url = `${URL}/wp-json/expoapi/v1/login_user`;
        let data = {
            user_id: user_id,
        };

        let response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        let json = await response.json();
        return JSON.parse(json);
    } catch (err) {
        console.log(err);
        return null;
    }
}

export async function maybeSetUserLocation(coords, uid) {
    // send request to server to save token
    let url = `${URL}/wp-json/expoapi/v1/set_user_location`;
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
    });

    let json = await response.json();
    return json;
}

export async function GetAllPermissions() {
    try {
        if (Platform.OS === "android") {
            const userResponse = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            ]);
            return userResponse;
        } else if (Platform.OS === "ios") {
            // ios permissions
            return null;
        }
    } catch (err) {
        console.log(err);
    }
    return null;
}