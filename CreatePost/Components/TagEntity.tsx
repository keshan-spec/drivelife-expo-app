
import useKeyboardVisible from '../../hooks/useKeyboardVisible';
import { usePostProvider } from '../ContextProvider';
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import { TagEntity } from 'types';

// Example data and placeholder image
const PLACEHOLDER_PFP = 'https://via.placeholder.com/150';

interface TagSuggestionsProps {
    data: TagEntity[];
    setTaggedData: (data: any) => void;
    activePanel: string;
    searching: boolean;
    taggedData?: TagEntity[];
}

const TagSuggestions = ({ data, setTaggedData, activePanel, searching, taggedData }: TagSuggestionsProps) => {
    const { activeImageIndex, userGarage } = usePostProvider();

    const [localTaggedData, setLocalTaggedData] = React.useState<TagEntity[]>(taggedData || []);
    const isKeyboardVisible = useKeyboardVisible();

    const handleTagClick = (entity: TagEntity) => {
        setTaggedData([{
            x: 1,
            y: 1,
            index: activeImageIndex,
            label: entity.name,
            type: entity.type,
            id: entity.entity_id,
        }]);

        setLocalTaggedData([...localTaggedData, entity]);
    };

    const renderItem = ({ item }: {
        item: TagEntity;
    }) => (
        <View style={{ flex: 1 }}>
            <View style={styles.tagSuggestion}>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    {item.image !== 'search_q' && (
                        <View style={styles.imageContainer}>
                            <Image source={{ uri: item.image || PLACEHOLDER_PFP }} style={styles.image} />
                        </View>
                    )}

                    <View style={{
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        maxWidth: item.type === 'event' ? '70%' : '100%',
                    }}>
                        <Text
                            style={{
                                fontFamily: 'Poppins_500Medium',
                                fontSize: 14,
                            }}>
                            {item.name}
                        </Text>

                        {(item.type === 'car' && item.vehicle_name) ? <Text style={{ color: '#666', fontFamily: 'Poppins_500Medium', fontSize: 11 }}>
                            {item.vehicle_name}
                        </Text> : null}

                        {item.type === 'event' ? <Text style={{ color: '#666', fontFamily: 'Poppins_500Medium', fontSize: 11 }}>
                            {item.start_date} - {item.end_date}
                        </Text> : null}

                        {item.type === 'event' ? <Text style={{ color: '#666', fontFamily: 'Poppins_500Medium', fontSize: 11 }}>
                            {item.location}
                        </Text> : null}
                    </View>
                </View>

                <TouchableOpacity onPress={() => handleTagClick(item)}
                    style={{
                        backgroundColor: '#ae9159',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 4,
                    }}
                >
                    <Text
                        style={{
                            color: 'white',
                            fontSize: 12,
                            textAlign: 'center',
                            fontFamily: 'Poppins_600SemiBold',
                        }}>
                        {localTaggedData.find((tag) => tag.entity_id === item.entity_id) ? 'Tagged' : '+ Tag'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderGarageItem = ({ item }: {
        item: any;
    }) => (
        <View style={{ flex: 1 }}>
            <View style={styles.tagSuggestion}>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: item.cover_photo || PLACEHOLDER_PFP }} style={styles.image} />
                    </View>

                    <View style={{
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        maxWidth: item.type === 'event' ? '70%' : '100%',
                    }}>
                        <Text
                            style={{
                                fontFamily: 'Poppins_500Medium',
                                fontSize: 14,
                            }}>
                            {item.registration || 'No registration'}
                        </Text>

                        <Text style={{ color: '#666', fontFamily: 'Poppins_500Medium', fontSize: 11 }}>
                            {item.make} {item.model} {item.variant && `(${item.variant})`}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity onPress={() => handleTagClick({
                    name: item.registration ? item.registration : `${item.make} ${item.model} ${item.variant ? `(${item.variant})` : ''}`,
                    image: item.cover_photo,
                    type: 'car',
                    entity_id: item.id,
                })}
                    style={{
                        backgroundColor: '#ae9159',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 4,
                    }}
                >
                    <Text
                        style={{
                            color: 'white',
                            fontSize: 12,
                            textAlign: 'center',
                            fontFamily: 'Poppins_600SemiBold',
                        }}>
                        {localTaggedData.find((tag) => tag.entity_id == item.id) ? 'Tagged' : '+ Tag'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderGarage = () => {
        if (!Array.isArray(userGarage)) {
            return null;
        }

        return (
            <View>
                <Text
                    style={{
                        fontFamily: 'Poppins_600SemiBold',
                        fontSize: 15,
                        marginBottom: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: '#ddd',
                        paddingBottom: 10,
                    }}>
                    Your Garage
                </Text>

                <FlatList
                    style={{
                        width: '100%',
                        height: '85%',
                    }}
                    data={userGarage}
                    renderItem={renderGarageItem}
                    keyExtractor={(_, index) => index.toString()}
                    contentContainerStyle={styles.scrollView}
                />
            </View>
        );
    };

    if (!data.length && activePanel !== 'car') {
        return null;
    }

    if (!data.length && activePanel === 'car') {
        return (
            <View style={[styles.container]}>
                <Text
                    style={{
                        fontFamily: 'Poppins_600SemiBold',
                        fontSize: 15,
                        marginTop: 12,
                    }}>
                    Vehicle Search
                </Text>

                {!searching ? (
                    <Text
                        style={{
                            fontFamily: 'Poppins_500Medium',
                            fontSize: 12,
                            marginTop: 5,
                        }}>
                        Start typing above to search for vehicles
                    </Text>
                ) : (
                    <TagSuggestionSkeleton single />
                )}

                <View style={{ marginTop: 40 }}>
                    {renderGarage()}
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {activePanel === 'car' && (
                <View style={{
                    marginTop: 5,
                    marginBottom: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: '#ddd',
                    paddingBottom: 10,
                }}>
                    <Text
                        style={{
                            fontFamily: 'Poppins_600SemiBold',
                            fontSize: 15,
                            marginTop: 10,
                        }}>
                        Vehicle Search
                    </Text>
                </View>
            )}

            <FlatList
                style={{
                    width: '100%',
                    height: activePanel === 'car' ? isKeyboardVisible ? '80%' : '50%' : '90%',
                }}
                data={data}
                renderItem={renderItem}
                keyExtractor={(_, index) => index.toString()}
                contentContainerStyle={styles.scrollView}
            />

            {activePanel === 'car' && (
                renderGarage()
            )}
        </View>
    );
};

export const TagSuggestionSkeleton = ({
    single = false
}) => {
    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollView}>
                <View style={styles.tagSuggestion}>
                    <View style={styles.imageContainer} />
                    <View style={{ width: '80%' }}>
                        <View style={{ width: '100%', height: 16, backgroundColor: '#e5e7eb', marginBottom: 4 }} />
                    </View>
                </View>
                {!single && (
                    <>
                        <View style={styles.tagSuggestion}>
                            <View style={styles.imageContainer} />
                            <View style={{ width: '80%' }}>
                                <View style={{ width: '100%', height: 16, backgroundColor: '#e5e7eb', marginBottom: 4 }} />
                            </View>
                        </View>
                        <View style={styles.tagSuggestion}>
                            <View style={styles.imageContainer} />
                            <View style={{ width: '80%' }}>
                                <View style={{ width: '100%', height: 16, backgroundColor: '#e5e7eb', marginBottom: 4 }} />
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        // maxHeight: 256, // max-h-44 in Tailwind
        marginBottom: 8,
        marginTop: 8,
        width: '100%',
        justifyContent: 'space-between',
        display: 'flex',
        flexDirection: 'column',
        alignContent: 'space-between',
        // borderWidth: 1,
        // borderColor: '#ccc',
    },
    scrollView: {
        flexGrow: 1,
    },
    tagSuggestion: {
        marginVertical: 10, // pb-2 in Tailwind
        paddingBottom: 10, // pb-2 in Tailwind
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8, // gap-2 in Tailwind
    },
    imageContainer: {
        width: 32, // w-8 in Tailwind
        height: 32, // h-8 in Tailwind
        borderRadius: 4, // rounded-full in Tailwind
        backgroundColor: '#e5e7eb', // bg-gray-200 in Tailwind
        borderWidth: 1,
        borderColor: '#ccc',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 4, // rounded-full in Tailwind
    },
});

export default TagSuggestions;
