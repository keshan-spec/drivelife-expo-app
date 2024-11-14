// App.js
import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PostProvider } from './ContextProvider';
import ImageSelector from './ImageSelector';
import SharePostStep1 from './SharePanel';

// get poppin font
import { useFonts } from 'expo-font';

import { Poppins_500Medium, Poppins_700Bold, Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import SharePostTagPanel from './SharePanelTags';
import { CreatePostProps } from '../types';

const Stack = createStackNavigator();

interface CreatePostPanelProps {
    onComplete: (props: CreatePostProps) => Promise<void>;
    onClose: () => void;
    userId: string;
    association: {
        associationId: string | null;
        associationType: string | null;
    };
}

const CreatePost = ({
    onComplete,
    onClose,
    userId,
    association
}: CreatePostPanelProps) => {
    const [fontsLoaded] = useFonts({
        Poppins_500Medium,
        Poppins_700Bold,
        Poppins_600SemiBold
    });

    if (!fontsLoaded) {
        return null;
    }

    return (
        <PostProvider userId={userId} association={association}>
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

export default React.memo(CreatePost);
