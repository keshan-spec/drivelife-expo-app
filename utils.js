import { PermissionsAndroid } from 'react-native';

export const requestLocationPermission = async () => {
    try {
        // if permission is granted, then return true
        if (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)) {
            return true;
        }

        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: 'CarCalendar Location Permission',
                message:
                    'CarCalendar needs access to your location ' +
                    'so you can see events near you.',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('You can use the LOCATION');
        } else {
            console.log('LOCATION permission denied');
        }
    } catch (err) {
        console.warn(err);
    }
};

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
    let url = 'https://www.carcalendar.co.uk/wp-json/expoapi/v1/get_external_uid';
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
    return json;
}