import { SafeAreaView } from "react-native";
import { WebView } from 'react-native-webview'
import OneSignal from 'react-native-onesignal';
import Constants from 'expo-constants';
import 'expo-dev-client';

import { useEffect, useState } from 'react';
import { requestLocationPermission, getExternalUIDInWP, setExpoTokenInWP } from './utils'

export default function App() {
  const [carcalSession, setcarcalSession] = useState('');

  useEffect(() => {
    requestLocationPermission();
    OneSignal.setAppId(Constants.manifest.extra.onesignal.app_id);

    OneSignal.setNotificationWillShowInForegroundHandler((notificationReceivedEvent) => {
      let notification = notificationReceivedEvent.getNotification();
      let notifId = notification.notificationId;
      let title = notification.title;

      console.log('OneSignal: notification will show in foreground: ', notifId, title);

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
  }, []);

  const INJECTED_JAVASCRIPT = `(function() {
    const allData = window.localStorage.getItem('ccevents_ukey');
    window.ReactNativeWebView.postMessage(allData);
  })();`;

  const onMessage = (payload) => {
    if (payload.nativeEvent.data) {
      setcarcalSession(payload.nativeEvent.data);
    }
  };

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
      if (id) {
        OneSignal.setExternalUserId(id);
      }
    });
  }

  return (
    <SafeAreaView style={{
      flex: 1,
    }}>
      <WebView
        source={{ uri: 'http://appdev.carcalendar.co.uk/index.php' }}
        injectedJavaScript={INJECTED_JAVASCRIPT}
        onMessage={onMessage}
      />
    </SafeAreaView>
  );
}