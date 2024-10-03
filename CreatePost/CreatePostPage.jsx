// App.js
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PostProvider } from './ContextProvider';
import ImageSelector from './ImageSelector';
import SharePostStep1 from './SharePanel';
import { Dimensions, StyleSheet } from 'react-native';

// get poppin font
import { useFonts } from 'expo-font';

import { Poppins_500Medium, Poppins_700Bold, Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import SharePostTagPanel from './SharePanelTags';

const numColumns = 3;
const screenWidth = Dimensions.get('window').width;

const Stack = createStackNavigator();

const CreatePost = ({
    onComplete,
    onClose,
    userId,
}) => {
    const [fontsLoaded] = useFonts({
        Poppins_500Medium,
        Poppins_700Bold,
        Poppins_600SemiBold
    });

    if (!fontsLoaded) {
        return null;
    }

    return (
        <PostProvider userId={userId}>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="ImageSelection">
                    <Stack.Screen
                        name="Image Selection"
                        options={{ headerShown: false }}
                    >
                        {({ navigation }) => (
                            <ImageSelector navigation={navigation} onClose={onClose} />
                        )}
                    </Stack.Screen>
                    <Stack.Screen
                        name="SharePost"
                        options={{ headerShown: false }}
                    >
                        {({ navigation }) => (
                            <SharePostStep1 navigation={navigation} onComplete={onComplete} />
                        )}
                    </Stack.Screen>
                    <Stack.Screen
                        name="SharePanelTags"
                        options={{ headerShown: false }}
                    >
                        {({ navigation }) => (
                            <SharePostTagPanel navigation={navigation} onComplete={onComplete} />
                        )}
                    </Stack.Screen>
                </Stack.Navigator>
            </NavigationContainer>
        </PostProvider>
    );
};

const styles = StyleSheet.create({
    multiSelectBtn: {
        // style a modern button
        backgroundColor: '#151617',
        borderRadius: 9999,
        padding: 10,
        margin: 5,
        color: 'white',
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'black',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    closeButton: {
        fontSize: 16,
        color: '#3b54f5',
    },
    item: {
        flex: 1,
        margin: 1,
    },
    itemInvisible: {
        backgroundColor: 'transparent',
    },
    image: {
        width: (screenWidth / numColumns) - 2,
        height: (screenWidth / numColumns) - 2,
    },
    selectedImageTile: {
        borderWidth: 2,
        borderColor: 'blue',
        opacity: 0.5,
    },
    topHalf: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#151617',
    },
    bottomHalf: {
        flex: 1,
    },
    selectedImage: {
        width: screenWidth,
        height: '100%',
        resizeMode: 'contain',
    },
    buttonContainer: {
        display: 'flex',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
    },
});


export default CreatePost;
