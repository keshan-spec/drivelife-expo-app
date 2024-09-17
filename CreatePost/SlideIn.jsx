import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, Animated, PanResponder, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchTaggableEntites } from './actions/create-post';
import TagSuggestions, { TagSuggestionSkeleton } from './Components/TagEntity';
import debounce from 'lodash.debounce'; // Assuming lodash.debounce is installed
import { usePostProvider } from './ContextProvider';

const BottomSheet = ({ visible, onClose, title, activePanel, onTag }) => {
    const translateY = useRef(new Animated.Value(500)).current;

    const { taggedEntities } = usePostProvider();

    const [taggableEntities, setTaggableEntities] = useState([]);
    const [searching, setSearching] = useState(false);


    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 0,
            onPanResponderMove: (_, gestureState) => {
                translateY.setValue(gestureState.dy);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    Animated.timing(translateY, {
                        toValue: 500,
                        duration: 100,
                        useNativeDriver: true,
                    }).start(() => {
                        onClose();
                    });
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
        } else {
            setSearching(false);
            setTaggableEntities([]);
        }
    }, [visible]);

    const handleClose = () => {
        Animated.timing(translateY, {
            toValue: 500,
            duration: 100,
            useNativeDriver: true,
        }).start(() => {
            onClose();
        });
    };

    const fetchTaggableEntitiesDebounced = useCallback(debounce(async (text) => {
        if (text.length <= 3) {
            return;
        }

        try {
            setSearching(true);
            const response = await fetchTaggableEntites(1, text, taggedEntities, activePanel === 'vehicles');
            setTaggableEntities(response);
            setSearching(false);
        } catch (error) {
            setSearching(false);
            console.error(error);
        }
    }, 300), [activePanel]);

    const onTextChange = (text) => {
        if (!text) {
            setTaggableEntities([]);
            return;
        }
        fetchTaggableEntitiesDebounced(text);
    };

    return (
        <View>
            <Modal
                transparent
                visible={visible}
                animationType="none"
                onRequestClose={handleClose}
                collapsable
            >
                <View style={styles.overlay}>
                    <TouchableOpacity style={styles.background} onPress={handleClose} />
                    <Animated.View
                        style={[styles.bottomSheetContainer, { transform: [{ translateY }] }]}
                        {...panResponder.panHandlers}
                    >
                        <View style={styles.header}>
                            <Text style={styles.headerText}>{title}</Text>
                            <TouchableOpacity onPress={handleClose}>
                                <MaterialCommunityIcons name="close" size={18} color="black" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.content}>
                            {/* Search input */}
                            <TextInput
                                placeholder="Search"
                                onChange={(e) => onTextChange(e.nativeEvent.text)}
                                style={styles.input}
                            />
                            {searching && <TagSuggestionSkeleton />}
                            <TagSuggestions
                                data={taggableEntities}
                                setTaggedData={onTag}
                            />
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};


const styles = StyleSheet.create({
    input: {
        display: 'flex',  // React Native uses 'flex' instead of 'block'
        width: '100%',
        paddingVertical: 6,  // .375rem converted to pixels
        paddingHorizontal: 12,  // .75rem converted to pixels
        fontSize: 15,  // 1rem converted to pixels (assuming 1rem = 16px)
        fontWeight: '400',
        lineHeight: 24,  // 1.5 * fontSize (16)
        color: '#212529',
        backgroundColor: '#fff',
        borderColor: '#ced4da',
        borderWidth: 1,
        borderRadius: 4,  // .25rem converted to pixels
        fontFamily: 'Poppins_500Medium',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    background: {
        flex: 1,
    },
    bottomSheetContainer: {
        height: '80%',
        backgroundColor: 'white',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    header: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomColor: '#ccc',
        borderBottomWidth: 1,
        padding: 13,
    },
    headerText: {
        fontSize: 15,
        color: 'black',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        fontFamily: 'Poppins_500Medium',
    },
    content: {
        fontSize: 16,
        textAlign: 'center',
        padding: 20,
        fontFamily: 'Poppins_500Medium',
    },
});

export default BottomSheet;
