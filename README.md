# Set Up
- Suggested Node version 16.x. If you have a higher version, use nvm to install and use v16.
- Run `yarn|npm install` to install dependencies. 
- Install the OneSignal Expo SDK for Expo. `expo install onesignal-expo-plugin`. The onesignal library will be installed since its a dependency in the `package.json`.
- Run `npx expo start` to start up the Metro Bundler, now you can either run the app in an emulator running in your machine. Or run it on your physical device using the Expo Go/Client App. 

```
Note: Expo will not link the OneSignal plugin if you run the `npx expo start` command. 
The app will function, but OneSignal will not work.
```

- Run `expo prebuild`. This creates the build folders. `android/` & `/ios`.

- Finally, run `npx expo run:[platform]`. Replace `[platform]` with your native platform. 

# Development Builds (Added in second commit)
Start the development build by running `npx expo start --dev-client`. Using this, you can test OneSignal without having to build the app. Saves the trouble of building.
- https://docs.expo.dev/development/use-development-builds/

# Issues & Fixes
- The application will not build if the JDK installed locally is > 11. You can read about this [issue](https://github.com/expo/expo-cli/issues/4196). 
- Build exit with code 1. [Issue](https://github.com/expo/expo/issues/15183)
- Execution failed for task ':app:checkDebugAarMetadata'. [Issue](https://github.com/OneSignal/react-native-onesignal/issues/1318).
- If `npx expo run:android` doesn't work after the fixes above. `cd /android` and `./gradlew clean`. Or run `npx expp prebuild --clean`.  

