import {
    PermissionsAndroid
} from 'react-native';
import Constants from 'expo-constants';

export const URL = Constants.expoConfig.extra.headlessAPIUrl;

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
    let url = `${URL}/wp-json/app/v1/update-last-location`;
    let data = {
        coords: {
            latitude: coords.latitude,
            longitude: coords.longitude,
        },
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

import {
    Platform
} from 'react-native';
import {
    check,
    request,
    PERMISSIONS,
    RESULTS,
    requestNotifications
} from 'react-native-permissions';

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
            const {
                status
            } = await requestNotifications(['alert', 'sound', 'badge', '']);

            const permissions = [
                PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
                PERMISSIONS.IOS.LOCATION_ALWAYS,
            ];

            const results = {
                'ios.permission.NOTIFICATIONS': status,
            };

            for (let permission of permissions) {
                const result = await request(permission);
                results[permission] = result;
            }

            return results;
        }
    } catch (err) {
        console.log(err);
    }
    return null;
}

export const requestIOSMediaPermissions = async () => {
    const permissions = [
        PERMISSIONS.IOS.CAMERA,
        PERMISSIONS.IOS.PHOTO_LIBRARY,
        PERMISSIONS.IOS.MEDIA_LIBRARY,
    ];

    const results = {};

    for (let permission of permissions) {
        const result = await request(permission);
        results[permission] = result;
    }

    return results;
}


// export async function GetAllPermissions() {
//     try {
//         if (Platform.OS === "android") {
//             const userResponse = await PermissionsAndroid.requestMultiple([
//                 PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//                 PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
//                 PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
//             ]);
//             return userResponse;
//         } else if (Platform.OS === "ios") {
//             // ios permissions
//             return null;
//         }
//     } catch (err) {
//         console.log(err);
//     }
//     return null;
// }

export const associateDeviceWithUser = async (uid, token) => {
    // send request to server to save token
    let url = `${URL}/wp-json/expoapi/v1/associate-user-with-device`;

    let data = {
        user_id: uid,
        device_id: token,
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
};

export const setUserAsInactive = async (uid, token) => {
    // send request to server to save token
    let url = `${URL}/wp-json/expoapi/v1/set-associated-user-as-inactive`;

    let data = {
        user_id: uid,
        device_id: token,
    };

    let response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    // let json = await response.json();
    // return json;
};