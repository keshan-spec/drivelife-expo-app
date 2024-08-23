import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SafeAreaView, AppState, Alert, Linking, ScrollView, BackHandler, Platform, StatusBar, View, Text } from "react-native";
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import 'expo-dev-client';
import Geolocation, { GeolocationResponse } from '@react-native-community/geolocation';
import OneSignal from 'react-native-onesignal';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import BackgroundService from 'react-native-background-actions';

// https://stackoverflow.com/questions/54075629/reactnative-permission-always-return-never-ask-again
import { associateDeviceWithUser, GetAllPermissions, maybeSetUserLocation, setUserAsInactive } from './utils';
import CreatePost from "./CreatePost/CreatePostPage";
import { addPost } from "./CreatePost/actions/create-post";
import { CreatePostProps, WebMessage } from 'types';
import { requestNotifications } from 'react-native-permissions';
import ProgressNotification from './ProgressNotif';

const URL = 'https://phpstack-889362-4370795.cloudwaysapps.com';
const options = {
  taskName: 'PostUpload',
  taskTitle: 'Post Upload',
  taskDesc: 'Refining your post...',
  taskIcon: {
    name: 'notification_icon',
    type: 'drawable',
  },
  color: '#b89855',
  linkingURI: 'uploadFile',
};

type Coords = GeolocationResponse['coords'];

export default function App() {
  const [carcalSession, setCarcalSession] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState('');
  const [location, setLocation] = useState<Coords>();
  const [permissionsLocation, setPermissionsLocation] = useState({ denied: false, granted: false });

  const [view, setView] = useState('webview');

  const [messageData, setMessageData] = useState<WebMessage>();

  const appState = useRef(AppState.currentState);
  const webViewRef = useRef<WebView | null>(null);

  const [deepLinkUrl, setDeepLinkUrl] = useState('');

  // This state saves whether your WebView can go back
  const [webViewcanGoBack, setWebViewcanGoBack] = useState(false);

  const setNotifChannels = async () => {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        console.log('Notification received:', notification);

        // Check if the notification has content
        const { title, body } = notification.request.content;

        if (title && body) {
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          };
        } else {
          console.log('Contentless notification filtered out');
          return {
            shouldShowAlert: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          };
        }
      },
    });
  };

  useEffect(() => {
    // Handle user clicking on a notification and open the screen
    const handleNotificationClick = async (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;

      console.log('Notification clicked:', data);

      if (data && data.post_id) {
        setDeepLinkUrl(`${URL}/post-view/${data.post_id}`);
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
    OneSignal.setAppId(Constants.expoConfig?.extra?.onesignal.app_id);
    OneSignal.addSubscriptionObserver((event) => {
      // if event.to is true, the user is subscribed
      // console.log(`OneSignal Subscription Changed: ${event}`);
      if (event.to) {
        // get user id 
        OneSignal.getDeviceState().then((deviceState) => {
          if (deviceState && deviceState.userId) {
            console.log(`OneSignal Player ID: ${deviceState.userId}`);
            setPlayerId(deviceState.userId);
          }
        });
      }
    });

    // Get the user permissions for location and notifications
    (async () => {
      let res = await GetAllPermissions() as any;

      if (Platform.OS === 'android') {
        // Location
        if (res?.["android.permission.ACCESS_FINE_LOCATION"] === "granted") {
          setPermissionsLocation({ denied: false, granted: true });
          getCurrentPosition();
        } else {
          setPermissionsLocation({ denied: true, granted: false });
        }

        // Notifications
        if (res?.["android.permission.POST_NOTIFICATIONS"] === "granted") {
          OneSignal.getDeviceState().then((deviceState) => {
            if (deviceState && deviceState.userId) {
              setPlayerId(deviceState.userId);
            }
          });
        } else {
          console.log('Notification permission denied');
        }
      } else if (Platform.OS === 'ios') {
        // Location
        if (res?.["ios.permission.LOCATION_WHEN_IN_USE"] === "granted" || res?.["ios.permission.LOCATION_ALWAYS"] === "granted") {
          setPermissionsLocation({ denied: false, granted: true });
          getCurrentPosition();
        } else {
          setPermissionsLocation({ denied: true, granted: false });
        }

        requestNotifications(['alert', 'sound', 'badge']).then(({ status, settings }) => {
          // Notifications
          if (status === "granted") {
            OneSignal.getDeviceState().then((deviceState) => {
              if (deviceState && deviceState.userId) {
                setPlayerId(deviceState.userId);
              }
            });
          } else {
            console.log('Notification permission denied');
          }
        });
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
      const data = notification.notification.additionalData as { url?: string; };
      if (data && data.url) {
        setDeepLinkUrl(`${URL}${data.url}`);
      }
    });

    // OneSignal.setInAppMessageClickHandler((event) => {
    //   console.log('OneSignal IAM clicked:', event);
    // });

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
    const handleUrl = (url: { url: string; }) => {
      setDeepLinkUrl(url.url);
    };

    // Add a listener for 'url' event
    Linking.addEventListener('url', handleUrl);

    // Handles the AppState
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (permissionsLocation.granted == true) {
          getCurrentPosition();
        }
      }

      appState.current = nextAppState;
    });

    // Remove event listener on unmount
    return () => {
      Linking.removeAllListeners('url');
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    setExternalId();
  }, [carcalSession]);

  // Set the external user id in OneSignal
  const setExternalId = useCallback(async () => {
    if (carcalSession) {
      await associateDeviceWithUser(carcalSession, playerId);

      if (location && location !== null) {
        console.log(`Location status :`, location);
        await maybeSetUserLocation(location, carcalSession);
      }
    }
  }, [carcalSession, playerId]);

  const onPostCreateBtnPress = useCallback(async ({
    media,
    caption,
    location,
    taggedEntities,
  }: CreatePostProps) => {
    try {
      await setNotifChannels();
      setDeepLinkUrl(URL);
      setView('webview');

      await BackgroundService.start(() =>
        addPost({
          user_id: carcalSession,
          mediaList: media,
          caption,
          location,
          taggedEntities,
          association_id: messageData?.association_id,
          association_type: messageData?.association_type,
        }),
        options
      );
    } catch (error) {
      await BackgroundService.stop();
      console.error('Error uploading post:', error);
    }
  }, [carcalSession, messageData]);

  // Get the users current location
  const getCurrentPosition = () => {
    Geolocation.getCurrentPosition((pos) => {
      if (pos.coords) {
        setLocation(pos.coords);
      }
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

  const onMessage = async (payload: WebViewMessageEvent) => {
    const data = payload.nativeEvent.data;

    try {
      if (data === 'exit_app') {
        // Display a confirmation alert before closing the app
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Yes', onPress: () => BackHandler.exitApp() },
          ],
          { cancelable: false }
        );
        return;
      }

      const message = JSON.parse(data) as WebMessage;

      switch (message.type) {
        case 'authData':
          setCarcalSession(message.user_id);
          break;
        case 'createPost':
          const isRunning = BackgroundService.isRunning();

          if (isRunning) {
            Alert.alert('DriveLife', 'Please wait for the current post to finish uploading', [
              { text: 'OK' }
            ]);
            BackgroundService.stop()
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
          setMessageData(message);
          break;
        case 'signOut':
          await setUserAsInactive(carcalSession, playerId);
          setCarcalSession(null);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  // const handleBackPress = useCallback(() => {
  //   try {
  //     if (webViewRef.current) {
  //       if (webViewcanGoBack) {
  //         webViewRef.current.goBack(); // Attempt to go back within the WebView
  //         return true; // Prevent default behavior (closing the app)
  //       } else {
  //         return false; // Default behavior (close the app)
  //       }
  //     } else {
  //       setView('webview');
  //       return true;
  //     }
  //   } catch (error) {
  //     console.log(`Error going back:`, error);
  //     return false; // Default behavior (close the app)
  //   }
  // }, [webViewcanGoBack, view]);

  const handleBackPress = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.onAppBackKey) {
          window.onAppBackKey();
        }
      `);
      return true; // Prevent default behavior (closing the app)
    } else {
      return false; // Default behavior (close the app)
    }
  }, []);

  return (
    <SafeAreaView style={{
      flex: 1,
      position: 'relative',
      backgroundColor: '#fff',
    }}>
      <StatusBar
        barStyle="default"
        hidden={false}
      />

      {/* <ProgressNotification progress={progress} /> */}
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
            mediaCapturePermissionGrantType='grant'

            allowsBackForwardNavigationGestures
            javaScriptEnabled
            autoManageStatusBarEnabled
            allowsInlineMediaPlayback
            source={{ uri: `${URL}${deepLinkUrl ? '?deeplink=' + deepLinkUrl : ''}` }}
            // source={{ uri: `https://www.carevents.com/uk/get-tickets/event.php?event_id=WGlGNUhEWFE0cTZIWWJXT3RPaHN5dz09` }}
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