import { SafeAreaView, AppState, Alert, Linking, ScrollView, BackHandler, Platform } from "react-native";
import { useEffect, useState, useRef, useCallback } from 'react';
import { WebView } from 'react-native-webview';

import 'expo-dev-client';
import Geolocation from '@react-native-community/geolocation';
import OneSignal from 'react-native-onesignal';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import BackgroundService from 'react-native-background-actions';

// https://stackoverflow.com/questions/54075629/reactnative-permission-always-return-never-ask-again
import { GetAllPermissions } from './utils';
import CreatePost from "./CreatePost/CreatePostPage";
import { addPost } from "./CreatePost/actions/create-post";

const INJECTED_JAVASCRIPT = `(function() {
    const allData = window.localStorage.getItem('ccevents_ukey');
    // add custom localstorage item to say that the user is using the app
    window.localStorage.setItem('ccevents_app', 'true');
    // window.ReactNativeWebView.postMessage(allData);
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'allData', data: allData }));
})();`;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const URL = 'https://phpstack-889362-4370795.cloudwaysapps.com';
const options = {
  taskName: 'PostUpload',
  taskTitle: 'Post Upload',
  taskDesc: 'Refining your post...',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#ff00ff',
  linkingURI: 'uploadFile',
};

export default function App() {
  const [carcalSession, setCarcalSession] = useState('');
  const [onesignalRegistered, setOnesignalRegistered] = useState(false);
  const [playerId, setPlayerId] = useState('');
  const [location, setLocation] = useState();
  const [permissionsLocation, setPermissionsLocation] = useState({ denied: false, granted: false });

  const [view, setView] = useState('webview');

  const appState = useRef(AppState.currentState);
  const webViewRef = useRef();

  const [deepLinkUrl, setDeepLinkUrl] = useState('');

  // This state saves whether your WebView can go back
  const [webViewcanGoBack, setWebViewcanGoBack] = useState(false);

  useEffect(() => {
    const setNotifChannels = async () => {
      // create a channel with the custom notification sound
      await Notifications.setNotificationChannelAsync('primary', {
        name: 'Primary',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        audioAttributes: {
          usage: Notifications.AndroidAudioUsage.NOTIFICATION,
          contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        },
        sound: 'custom_sound.wav',
      });
    };

    setNotifChannels();

    // Handle user clicking on a notification and open the screen
    const handleNotificationClick = async (response) => {
      const data = response.notification.request.content.data;

      if (data && data.post_id) {
        setDeepLinkUrl(`${URL}/posts/${data.post_id}`);
      }
    };

    // Listen for user clicking on a notification
    const notificationClickSubscription = Notifications.addNotificationResponseReceivedListener(handleNotificationClick);

    return () => {
      notificationClickSubscription.remove();
    };
  }, []);


  // OneSignal Initialization
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

    // Get the user permissions for location and notifications
    (async () => {
      let res = await GetAllPermissions();

      if (Platform.OS === 'android') {
        // Location
        if (res["android.permission.ACCESS_FINE_LOCATION"] === "granted") {
          setPermissionsLocation({ denied: false, granted: true });
          getCurrentPosition();
        } else setPermissionsLocation({ denied: true, granted: false });

        // Notifications
        if (res["android.permission.POST_NOTIFICATIONS"] === "granted") {
          OneSignal.getDeviceState().then((deviceState) => {
            console.log(`OneSignal Player ID: ${deviceState.userId}`);
            setPlayerId(deviceState.userId);
          });
        } else {
          console.log('Notification permission denied');
        }
      }
    })();

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
    };
  }, []);

  // Add a listener for the back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      backHandler.remove();
    };
  }, [webViewcanGoBack]);

  // Event listeners
  useEffect(() => {
    const handleUrl = (url) => {
      setDeepLinkUrl(url.url);
    };

    // Add a listener for 'url' event
    Linking.addEventListener('url', handleUrl);

    // Handles the AppState
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
        if (permissionsLocation.granted == true) {
          getCurrentPosition();
        }
      }

      appState.current = nextAppState;
    });

    // Remove event listener on unmount
    return () => {
      Linking.removeEventListener('url', handleUrl);
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (carcalSession) {
      (async () => {

        // if (location && location !== null) {
        //   const res = await maybeSetUserLocation(location, carcalSession);
        //   // console.log(`Location status :`, res)
        // }

        // Set the external user id in OneSignal
        if (carcalSession && !onesignalRegistered) {
          OneSignal.setAppId(Constants.manifest.extra.onesignal.app_id);

          console.log(`Setting external user id in OneSignal: ${carcalSession}, ${playerId}`);
          OneSignal.setExternalUserId(`${carcalSession}`, playerId, (results) => {
            console.log('OneSignal external user id set:', results);
          });
          setOnesignalRegistered(true);
        }
      })();
    }
  }, [carcalSession]);

  const onPostCreateBtnPress = useCallback(async ({
    media,
    caption,
    location,
    taggedEntities,
  }) => {
    try {
      setDeepLinkUrl(`https://phpstack-889362-4370795.cloudwaysapps.com/`);
      setView('webview');

      await BackgroundService.start(() =>
        addPost({
          user_id: carcalSession,
          mediaList: media,
          caption,
          location,
          taggedEntities,
        }),
        options
      );
    } catch (error) {
      await BackgroundService.stop();
      console.error('Error uploading post:', error);
    }
  }, [carcalSession]);

  // Get the users current location
  const getCurrentPosition = () => {
    Geolocation.getCurrentPosition((pos) => {
      if (pos.coords) setLocation(pos.coords);
    }, (error) => {
      Alert.alert("CarCalendar", error.message, [
        { text: "OK" },
        {
          text: "Settings",
          onPress: () => {
            Linking.openSettings();
          }
        }
      ]);
    },
      { enableHighAccuracy: true }
    );
  };

  const onMessage = async (payload) => {
    const data = payload.nativeEvent.data;

    try {
      const message = JSON.parse(data);

      if (message.type === 'authData') {
        setCarcalSession(message.user_id);
      } else if (message.type === 'createPost') {
        const isRunning = BackgroundService.isRunning();

        if (isRunning) {
          Alert.alert('CarCalendar', 'Please wait for the current post to finish uploading', [
            { text: 'OK' }
          ]);
          return;
        }

        if (!message.user_id || message.user_id === '') {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Authentication Required',
              body: 'Please login to create a post',
            },
            trigger: null,
            identifier: 'primary',
          });
          return;
        }

        setView('createPost');
        setCarcalSession(message.user_id);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  const handleBackPress = useCallback(() => {
    try {
      if (webViewRef.current) {
        if (webViewcanGoBack) {
          webViewRef.current.goBack(); // Attempt to go back within the WebView
          return true; // Prevent default behavior (closing the app)
        } else {
          return false; // Default behavior (close the app)
        }
      } else {
        setView('webview');
        return true;
      }
    } catch (error) {
      console.log(`Error going back:`, error);
      return false; // Default behavior (close the app)
    }
  }, [webViewcanGoBack, view]);

  const userRegisteredInOneSignal = async () => {
    if (carcalSession !== '' && carcalSession !== null) {
      const deviceState = await OneSignal.getDeviceState();
      return deviceState.userId === carcalSession;
    }
  };

  return (
    <SafeAreaView style={{
      flex: 1,
      position: 'relative',
    }}>
      {view === 'createPost' && (
        <CreatePost
          onClose={() => setView('webview')}
          onComplete={onPostCreateBtnPress}
        />
      )}

      {view === 'webview' && (
        <ScrollView
          contentContainerStyle={{
            flex: 1,
            backgroundColor: '#fff',
          }}
        >
          <WebView
            ref={webViewRef}
            source={{ uri: `${URL}${deepLinkUrl ? '?deeplink=' + deepLinkUrl : ''}` }}
            onMessage={onMessage}
            onLoadProgress={({ nativeEvent }) => {
              // This function is called everytime your web view loads a page
              // and here we change the state of can go back
              setWebViewcanGoBack(nativeEvent.canGoBack);
            }}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}