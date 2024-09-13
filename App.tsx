import React, { useEffect, useState, useRef, useCallback } from 'react';
import { AppState, Alert, Linking, BackHandler, Platform, StatusBar, View, ActivityIndicator } from "react-native";
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
import ProgressNotification from './ProgressNotif';

const URL = 'https://app.mydrivelife.com';
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

  const [isPostUploading, setIsPostUploading] = useState(false);
  const [postMedia, setPostMedia] = useState<string | null>(null);

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

  const appPermissionsInit = async () => {
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

      // Notifications
      if (res?.["ios.permission.NOTIFICATIONS"] === "granted") {
        OneSignal.getDeviceState().then((deviceState) => {
          if (deviceState && deviceState.userId) {
            setPlayerId(deviceState.userId);
          }
        });
      } else {
        console.log('Notification permission denied');
      }
    }
  }

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
    setNotifChannels();

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
        console.log('Notification opened:', `${URL}${data.url}`);

        setDeepLinkUrl(`${URL}${data.url}`);
      }
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
    if (carcalSession && playerId) {
      const response = await associateDeviceWithUser(carcalSession, playerId);
      console.log('response', response);

      if (location && location !== null) {
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
      // setDeepLinkUrl(URL);
      setView('webview');
      setIsPostUploading(true);
      setPostMedia(media[0].uri);

      await BackgroundService.start(() =>
        addPost({
          user_id: carcalSession,
          mediaList: media,
          caption,
          location,
          taggedEntities,
          association_id: messageData?.association_id,
          association_type: messageData?.association_type,
          onPostAdded: () => {
            setPostMedia(null);
            setIsPostUploading(false);
          },
        }),
        options
      );
    } catch (error) {
      setPostMedia(null);
      setIsPostUploading(false);
      await BackgroundService.stop();
      Alert.alert('Error', 'An error occurred while uploading the post', [
        { text: 'OK' },
      ]);
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
        // Alert.alert(
        //   'Exit App',
        //   'Are you sure you want to exit?',
        //   [
        //     { text: 'Cancel', style: 'cancel' },
        //     { text: 'Yes', onPress: () => BackHandler.exitApp() },
        //   ],
        //   { cancelable: false }
        // );
        BackHandler.exitApp();
        return;
      }

      const message = JSON.parse(data) as WebMessage;

      switch (message.type) {
        case 'authData':
          if (message.user_id) {
            setCarcalSession(message.user_id);
            await appPermissionsInit();
          }
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
    <View style={{
      flex: 1,
      position: 'relative',
      backgroundColor: '#000',
    }}>
      <StatusBar
        barStyle="default"
        hidden={false}
      />

      {(isPostUploading && postMedia) && (
        <ProgressNotification media_uri={postMedia} />
      )}

      {view === 'createPost' && (
        <CreatePost
          onClose={() => setView('webview')}
          onComplete={onPostCreateBtnPress}
        />
      )}

      <View
        style={{
          flex: 1,
          backgroundColor: '#fff',
          display: view === 'webview' ? 'flex' : 'none',
        }}
      >
        <WebView
          ref={webViewRef}
          onContentProcessDidTerminate={() => {
            console.log('Content Process Terminated');

            // reintialize the webview
            webViewRef.current?.reload();
          }}
          renderLoading={() => (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <ActivityIndicator size="large" color="#000" />
            </View>
          )}
          onLoad={() => {
            console.log('Webview loaded');
          }}
          mediaCapturePermissionGrantType='grant'
          bounces={false}
          contentMode='mobile'
          overScrollMode='never'
          onShouldStartLoadWithRequest={event => {
            // if url is not from the app, open it in the browser
            if (!event.url.startsWith(URL)) {
              Linking.openURL(event.url);
              return false;
            }

            return true;
          }}
          javaScriptEnabled
          autoManageStatusBarEnabled
          allowsInlineMediaPlayback
          source={{ uri: `${URL}${deepLinkUrl ? '?deeplink=' + deepLinkUrl : ''}` }}
          onMessage={onMessage}
          onLoadProgress={({ nativeEvent }) => {
            // This function is called everytime your web view loads a page
            // and here we change the state of can go back
            setWebViewcanGoBack(nativeEvent.canGoBack);
          }}
        />
      </View>
    </View>
  );
}