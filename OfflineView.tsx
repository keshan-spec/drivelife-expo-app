import { Image, Text, TouchableOpacity, View } from "react-native";
import React from "react";

export const OfflineView = ({
    refresh,
}: {
    refresh: () => void;
}) => {
    return (
        <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        }}>
            <Image
                style={{
                    width: 300,
                    height: 100,  // Allow height to scale based on aspect ratio
                    // aspectRatio: 1,     // You can adjust this based on your image's ratio (width / height)
                    resizeMode: 'contain',
                }}
                source={require('./assets/logo-dark.png')}
            />

            <Text style={{
                fontSize: 15,
                marginBottom: 20,
                textAlign: 'center',
                fontFamily: 'Poppins_500Medium',
            }}>Sorry, you have no data connection at the moment, please try again</Text>

            <TouchableOpacity
                style={{ width: 200, height: 40, borderRadius: 10, backgroundColor: '#ae9159' }}
                onPress={refresh}
            >
                <Text style={{
                    color: '#fff', textAlign: 'center', lineHeight: 45, fontSize: 18,
                    fontFamily: 'Poppins_500Medium',
                }}>Retry</Text>
            </TouchableOpacity>
        </View>
    );
};