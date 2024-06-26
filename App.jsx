import { SafeAreaView, AppState, Alert, Linking, RefreshControl, ScrollView, BackHandler, View, Text } from "react-native";
import { useEffect, useState, useRef, useCallback } from 'react';
import { WebView } from 'react-native-webview';
import OneSignal from 'react-native-onesignal';
import Constants from 'expo-constants';
import 'expo-dev-client';
import Geolocation from '@react-native-community/geolocation';
import BackgroundService from 'react-native-background-actions';

// https://stackoverflow.com/questions/54075629/reactnative-permission-always-return-never-ask-again
import { maybeSetUserLocation, getExternalUIDInWP, GetAllPermissions, loginUserinWP } from './utils';
import CreatePost from "./CreatePost/CreatePostPage";
import { addPost } from "./CreatePost/actions/create-post";

const INJECTED_JAVASCRIPT = `(function() {
    const allData = window.localStorage.getItem('ccevents_ukey');
    // add custom localstorage item to say that the user is using the app
    window.localStorage.setItem('ccevents_app', 'true');
    // window.ReactNativeWebView.postMessage(allData);
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'allData', data: allData }));
})();`;

import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [carcalSession, setcarcalSession] = useState('');
  const [onesignalRegistered, setOnesignalRegistered] = useState(false);
  const [playerId, setPlayerId] = useState('');
  const [location, setLocation] = useState();
  const [permissionsLocation, setPermissionsLocation] = useState({ denied: false, granted: false });
  const [webviewLoaded, setWebviewLoaded] = useState(false);

  const [view, setView] = useState('webview');

  const appState = useRef(AppState.currentState);

  const [refreshing, setRefreshing] = useState(false);
  const webViewRef = useRef();

  const [refresherEnabled, setEnableRefresher] = useState(true);
  const [deepLinkUrl, setDeepLinkUrl] = useState('');

  // This state saves whether your WebView can go back
  const [webViewcanGoBack, setWebViewcanGoBack] = useState(false);

  useEffect(() => {

    // Handle user clicking on a notification and open the screen
    const handleNotificationClick = async (response) => {
      const post_id = response.notification.request.content.data.post_id;

      if (post_id) {
        setDeepLinkUrl(`https://phpstack-889362-4370795.cloudwaysapps.com/posts/${post_id}`);
      }
    };

    // Listen for user clicking on a notification
    const notificationClickSubscription = Notifications.addNotificationResponseReceivedListener(handleNotificationClick);

    return () => {
      notificationClickSubscription.remove();
    };
  }, []);


  //Code to get scroll position
  const handleScroll = (event) => {
    const yOffset = Number(event.nativeEvent.contentOffset.y);
    if (yOffset === 0) setEnableRefresher(true);
    else setEnableRefresher(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    webViewRef.current.reload();

    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  }, []);

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
      if (message.type === 'allData') {
        setcarcalSession(payload.nativeEvent.data);
      } else if (message.type === 'open') {
        // const { url } = message
        // webViewRef.current.injectJavaScript(`window.location.href = '${url}';`)
      } else if (message.type === 'createPost') {
        // check if background service is running
        const isRunning = BackgroundService.isRunning();

        if (isRunning) {
          Alert.alert('CarCalendar', 'Please wait for the current post to finish uploading', [
            { text: 'OK' }
          ]);
          return;
        }

        // if (!message.user_id || message.user_id === '') {
        //   await Notifications.scheduleNotificationAsync({
        //     content: {
        //       title: 'Authentication Required',
        //       body: 'Please login to create a post',
        //     },
        //     trigger: null,
        //   });
        //   return;
        // }

        setView('createPost');
        setcarcalSession(1);
        console.log(`Create post message:`, message);
        setWebviewLoaded(false);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  const handleBackPress = useCallback(() => {
    try {
      if (webViewRef.current) {
        console.log(`Can go back:`, webViewcanGoBack);
        if (webViewcanGoBack) {
          webViewRef.current.goBack(); // Attempt to go back within the WebView
          return true; // Prevent default behavior (closing the app)
        } else {
          return false; // Default behavior (close the app)
        }
      }

      return false;
    } catch (error) {
      console.log(`Error going back:`, error);
      return false; // Default behavior (close the app)
    }
  }, [webViewcanGoBack]);

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

      // Location
      if (res["android.permission.ACCESS_FINE_LOCATION"] === "granted") {
        setPermissionsLocation({ denied: false, granted: true });
        getCurrentPosition();
      } else setPermissionsLocation({ denied: true, granted: false });

      // Notifications
      if (res["android.permission.POST_NOTIFICATIONS"] === "granted") {
        console.log('Notification permission granted');
      } else {
        console.log('Notification permission denied');
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

    // // Add a listener for 'message' event
    // webViewRef.current.onMessage = onMessage

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
        const id = await getExternalUIDInWP(carcalSession);
        if (id === null) {
          console.log(`Error getting external user id`);
          return;
        }

        // Check if user is logged in
        const res = await loginUserinWP(id);

        if (res.success) {
          // reload the webview
          webViewRef.current.reload();
        }

        if (location && location !== null) {
          const res = await maybeSetUserLocation(location, id);
          // console.log(`Location status :`, res)
        }

        // Set the external user id in OneSignal
        if (id && !onesignalRegistered) {
          OneSignal.setExternalUserId(id);
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
      const options = {
        taskName: 'PostUpload',
        taskTitle: 'Post Upload',
        taskDesc: 'Uploading media files',
        taskIcon: {
          name: 'ic_launcher',
          type: 'mipmap',
        },
        color: '#ff00ff',
        linkingURI: 'uploadFile',
      };

      setDeepLinkUrl(`https://phpstack-889362-4370795.cloudwaysapps.com/`);
      setView('webview');

      await BackgroundService.start(() => addPost({
        user_id: carcalSession,
        mediaList: media,
        caption,
        location,
        taggedEntities,
      }), options);
    } catch (error) {
      await BackgroundService.stop();
      console.error('Error uploading post:', error);
    }
  }, [carcalSession]);


  const renderUploadProgress = () => {
    return (
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Text style={{
          color: 'white',
          fontSize: 16,
        }}>Uploading media files...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{
      flex: 1,
    }}>
      {BackgroundService.isRunning() && renderUploadProgress()}
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
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              enabled={refresherEnabled}
            />
          }>
          <WebView
            ref={webViewRef}
            onLoadEnd={() => {
              setWebviewLoaded(true);
            }}
            source={{ uri: `https://phpstack-889362-4370795.cloudwaysapps.com${deepLinkUrl ? '?deeplink=' + deepLinkUrl : ''}` }}
            // injectedJavaScript={INJECTED_JAVASCRIPT}
            onMessage={onMessage}
            onScroll={handleScroll}
            // startInLoadingState={true}

            onLoadProgress={({ nativeEvent }) => {
              // This function is called everytime your web view loads a page
              // and here we change the state of can go back
              setWebViewcanGoBack(nativeEvent.canGoBack);
            }}
            setBuiltInZoomControls={true}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// import React from 'react';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
// } from 'react-native-reanimated';
// import {
//   Gesture,
//   GestureDetector,
//   GestureHandlerRootView,
// } from 'react-native-gesture-handler';
// import { StyleSheet, Dimensions } from 'react-native';

// function clamp(val, min, max) {
//   return Math.min(Math.max(val, min), max);
// }

// const { width, height } = Dimensions.get('screen');

// export default function App() {
//   const translationX = useSharedValue(0);
//   const translationY = useSharedValue(0);
//   const prevTranslationX = useSharedValue(0);
//   const prevTranslationY = useSharedValue(0);

//   const animatedStyles = useAnimatedStyle(() => ({
//     transform: [
//       { translateX: translationX.value },
//       { translateY: translationY.value },
//     ],
//   }));

//   const pan = Gesture.Pan()
//     .minDistance(1)
//     .onStart(() => {
//       prevTranslationX.value = translationX.value;
//       prevTranslationY.value = translationY.value;
//     })
//     .onUpdate((event) => {
//       const maxTranslateX = 500 / 2 - 50;
//       const maxTranslateY = height / 2 - 50;

//       translationX.value = clamp(
//         prevTranslationX.value + event.translationX,
//         -maxTranslateX,
//         maxTranslateX
//       );
//       translationY.value = clamp(
//         prevTranslationY.value + event.translationY,
//         -maxTranslateY,
//         maxTranslateY
//       );
//     })
//     .runOnJS(true);

//   return (
//     <GestureHandlerRootView style={styles.container}>
//       <GestureDetector gesture={pan}>
//         <Animated.View style={[animatedStyles, styles.box]}></Animated.View>
//       </GestureDetector>
//     </GestureHandlerRootView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     width: 500,
//     height: 500,
//     backgroundColor: '#f1f1f1',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   box: {
//     width: 100,
//     height: 100,
//     backgroundColor: '#b58df1',
//     borderRadius: 20,
//   },
// });
