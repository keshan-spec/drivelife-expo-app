
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
    const handleTagClick = (entity: TagEntity) => {
        setTaggedData([{
            x: 1,
            y: 1,
            index: 0,
            label: entity.name,
            type: entity.type,
            id: entity.entity_id,
        }]);
    };

    const renderItem = ({ item }: {
        item: TagEntity;
    }) => (
        <TouchableOpacity style={styles.tagSuggestion} onPress={() => handleTagClick(item)}>
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.image || PLACEHOLDER_PFP }} style={styles.image} />
            </View>
            <Text>{item.name}</Text>
        </TouchableOpacity>
    );

    if (!data.length) {
        return null;
    }

    return (
        <View style={styles.container}>
            <FlatList
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
        maxHeight: 256, // max-h-44 in Tailwind
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    scrollView: {
        flexGrow: 1,
    },
    tagSuggestion: {
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2 in Tailwind
    },
    imageContainer: {
        width: 32, // w-8 in Tailwind
        height: 32, // h-8 in Tailwind
        borderRadius: 16, // rounded-full in Tailwind
        backgroundColor: '#e5e7eb', // bg-gray-200 in Tailwind
        borderWidth: 2,
        borderColor: '#ccc',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 16, // rounded-full in Tailwind
    },
});

export default TagSuggestions;
