import { SafeAreaView, Text, AppState } from "react-native";
import { useEffect, useState, useRef } from 'react';
import { WebView } from 'react-native-webview'
import OneSignal from 'react-native-onesignal';
import Constants from 'expo-constants';
import 'expo-dev-client';
import Geolocation from '@react-native-community/geolocation';



import { maybeSetUserLocation, requestLocationPermission, getExternalUIDInWP, requestNotificationPermission } from './utils'

export default function App() {
  const [carcalSession, setcarcalSession] = useState('');
  const [onesignalRegistered, setOnesignalRegistered] = useState(false);
  const [playerId, setPlayerId] = useState('');
  const [location, setLocation] = useState();

  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  const getCurrentPosition = () => {
    Geolocation.getCurrentPosition((pos) => {
      if (pos.coords) setLocation(pos.coords);
      },(error) => Alert.alert('GetCurrentPosition Error', JSON.stringify(error)),
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    OneSignal.setAppId(Constants.manifest.extra.onesignal.app_id);
    OneSignal.addSubscriptionObserver((event) => {
      // if event.to is true, the user is subscribed
      // console.log(`OneSignal Subscription Changed: ${event}`);
      if (event.to) {
        // get user id 
        OneSignal.getDeviceState().then((deviceState) => {
          console.log(`OneSignal Player ID: ${deviceState.userId}`);
          setPlayerId(deviceState.userId);
        });
      }
    });

    requestLocationPermission().then((res) => {
      if (res === true) {
        console.log('Location permission granted');
        getCurrentPosition();
      }
    })

    requestNotificationPermission()

    OneSignal.setNotificationWillShowInForegroundHandler((notificationReceivedEvent) => {
      let notification = notificationReceivedEvent.getNotification();
      let notifId = notification.notificationId;
      let title = notification.title;

      console.log(`OneSignal New Notif> ID: ${notifId}, Title: ${title}`);

      notificationReceivedEvent.complete(notification);
    });

    OneSignal.setNotificationOpenedHandler((notification) => {
      console.log('OneSignal: notification opened:', notification);
    });

    OneSignal.setInAppMessageClickHandler((event) => {
      console.log('OneSignal IAM clicked:', event);
    });

    return () => {
      OneSignal.clearHandlers()
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
        requestLocationPermission().then((res) => {
          if (res === true) {
            getCurrentPosition();
          }
        })
      }

      appState.current = nextAppState;
      setAppStateVisible(appState.current);
      console.log('AppState', appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (carcalSession) {
    (async () => {
      const id = await getExternalUIDInWP(carcalSession);
      if (location && location !== null) {
        const res = await maybeSetUserLocation(location, id);
        console.log(`Location status : ${res}`);
      }

      // Set the external user id in OneSignal
      if (id && !onesignalRegistered) {
        OneSignal.setExternalUserId(id);
        setOnesignalRegistered(true);
      }
    })();
  }

  const INJECTED_JAVASCRIPT = `(function() {
    const allData = window.localStorage.getItem('ccevents_ukey');
    window.ReactNativeWebView.postMessage(allData);
  })();`;

  const onMessage = (payload) => {
    if (payload.nativeEvent.data) {
      setcarcalSession(payload.nativeEvent.data);
    }
  };


  return (
    <SafeAreaView style={{
      flex: 1,
    }}>
      <WebView
        source={{ uri: `https://staging1.carcalendar.co.uk/app/app.php?pid=${playerId}` }}
        injectedJavaScript={INJECTED_JAVASCRIPT}
        onMessage={onMessage}
      />
    </SafeAreaView>
  );
}