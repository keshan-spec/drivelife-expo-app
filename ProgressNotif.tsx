import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

const ProgressNotification = ({ progress }: { progress: number }) => {
    return (
        <View style={styles.container}>
            <View style={styles.progressContainer}>
                <Text style={styles.text}>Uploading: {Math.round(progress * 100)}%</Text>
                <ActivityIndicator size="large" color="#4caf50" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 30,
        width: '95%',
        zIndex: 9999,
        height: 100,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
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
        marginBottom: 10,
        fontSize: 16,
        textAlign: 'center',
    },
});

export default ProgressNotification;
