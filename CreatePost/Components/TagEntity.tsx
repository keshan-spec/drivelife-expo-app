
import { usePostProvider } from '../ContextProvider';
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import { TagEntity } from 'types';

// Example data and placeholder image
const PLACEHOLDER_PFP = 'https://via.placeholder.com/150';

interface TagSuggestionsProps {
    data: TagEntity[];
    setTaggedData: (data: any) => void;
}

const TagSuggestions = ({ data, setTaggedData }: TagSuggestionsProps) => {
    const { activeImageIndex } = usePostProvider();

    const [localTaggedData, setLocalTaggedData] = React.useState<TagEntity[]>([]);

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
        <View style={styles.tagSuggestion} >
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <View style={styles.imageContainer}>
                    <Image source={{ uri: item.image || PLACEHOLDER_PFP }} style={styles.image} />
                </View>
                <View style={{
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    maxWidth: item.type === 'event' ? '70%' : '100%',
                }}>
                    <Text
                        style={{
                            fontFamily: 'Poppins_500Medium',
                            fontSize: 13,
                        }}>
                        {item.name}
                    </Text>

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
    );

    if (!data.length) {
        return null;
    }

    return (
        <View style={styles.container}>
            <FlatList
                style={{
                    width: '100%',
                    height: '90%',
                }}
                data={data}
                renderItem={renderItem}
                keyExtractor={(_, index) => index.toString()}
                contentContainerStyle={styles.scrollView}
            />
        </View>
    );
};

export const TagSuggestionSkeleton = () => {
    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollView}>
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
                <View style={styles.tagSuggestion}>
                    <View style={styles.imageContainer} />
                    <View style={{ width: '80%' }}>
                        <View style={{ width: '100%', height: 16, backgroundColor: '#e5e7eb', marginBottom: 4 }} />
                    </View>
                </View>
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
