import { SafeAreaView, Text } from "react-native";
import { WebView } from 'react-native-webview'
import OneSignal from 'react-native-onesignal';
import Constants from 'expo-constants';
import 'expo-dev-client';

import { useEffect, useState } from 'react';
import { requestLocationPermission, getExternalUIDInWP, requestNotificationPermission } from './utils'

export default function App() {
  const [carcalSession, setcarcalSession] = useState('');
  const [onesignalRegistered, setOnesignalRegistered] = useState(false);
  const [playerId, setPlayerId] = useState('');

  useEffect(() => {
    OneSignal.setAppId(Constants.manifest.extra.onesignal.app_id);

    OneSignal.addSubscriptionObserver((event) => {
      // if event.to is true, the user is subscribed
      console.log(`OneSignal Subscription Changed: ${event}`);
      if (event.to) {
        // get user id 
        OneSignal.getDeviceState().then((deviceState) => {
          console.log(`OneSignal Player ID: ${deviceState.userId}`);
          setPlayerId(deviceState.userId);
        });
      }

    });

    requestLocationPermission()
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
      OneSignal.clearHandlers();
    }
  }, [playerId]);

  if (carcalSession) {
    console.log(`Found carcalSession: ${carcalSession}`);
    getExternalUIDInWP(carcalSession).then((id) => {
      // format the external user id
      // remove ""
      id = id.replace(/"/g, '');
      // remove spaces
      id = id.replace(/\s/g, '');
      console.log(`Found external UID: ${id}`);

      // Set the external user id in OneSignal
      if (id && !onesignalRegistered) {
        OneSignal.setExternalUserId(id);
        setOnesignalRegistered(true);
      }
    });
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