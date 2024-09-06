import { getProgress } from './CreatePost/actions/progress';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';

const ProgressNotification = ({
    media_uri,
}: {
    media_uri: string;
}) => {
    const [progress, setProgress] = useState(getProgress());

    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         setProgress(getProgress());
    //     }, 500); // Update every 500ms

    //     return () => clearInterval(interval); // Cleanup on unmount
    // }, []);


    return (
        <View style={styles.container}>
            <View style={styles.progressContainer}>
                <View style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 10,
                    alignItems: 'center',
                }}>
                    <Image
                        source={{ uri: media_uri }}
                        style={{ width: 40, height: 40, borderRadius: 6 }}
                    />
                    <Text style={styles.text}>Uploading Post</Text>
                </View>
                {/* <Text style={styles.text}>Uploading: {Math.round(progress * 100)}%</Text> */}

                <ActivityIndicator size="small" color="#4caf50" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 90,
        width: '95%',
        zIndex: 9999,
        height: 55,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        margin: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5, // For Android shadow
    },
    progressContainer: {
        gap: 10,
        margin: 10,
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    text: {
        fontSize: 14,
        textAlign: 'center',
    },
});

export default ProgressNotification;
