import React, { useCallback, useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
} from 'react-native';
import Accordion from 'react-native-collapsible/Accordion';


import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet from './SlideIn';
import { usePostProvider } from './ContextProvider';

const TaggedEntity = ({ label, type, onRemove, canRemove = true }) => {
    return (
        <View style={{
            flexDirection: 'row',
            gap: 8,
            padding: 7,
            backgroundColor: '#ae9159',
            margin: 4,
            borderRadius: 8,
        }}>
            <Text style={[styles.textSmall, {
                color: '#fff',
            }]}>{label}</Text>
            {canRemove && (
                <TouchableOpacity onPress={onRemove}>
                    <MaterialCommunityIcons name="close" size={16} color="#fff" />
                </TouchableOpacity>
            )}
        </View>
    );
};

function Collapsible() {
    const [activeSections, setActiveSections] = useState([]);
    const [showSheet, setShowSheet] = useState(false);
    const [activePanel, setActivePanel] = useState('users');

    const { taggedEntities, activeImageIndex, setTaggedEntities } = usePostProvider();

    const toggleSheet = useCallback(() => {
        setShowSheet(!showSheet);
    }, [showSheet]);

    const onTagRemove = (arr_idx) => {
        setTaggedEntities(taggedEntities.filter((tag) => tag.arr_idx !== arr_idx));
    };


    const renderTagUsers = () => {
        return (
            <View style={styles.tagBadgeContainer}>
                {taggedEntities.filter((entity) => entity.type === 'user' && entity.index == activeImageIndex).map((entity, index) => (
                    <TaggedEntity
                        key={index}
                        label={entity.label}
                        type={entity.type}
                        onRemove={() => {
                            onTagRemove(entity.arr_idx);
                            // setTaggedEntities(taggedEntities.filter((_, i) => i !== index));
                        }}
                    />
                ))}
            </View>
        );
    };

    const renderTagVehicles = () => {
        return (
            <View style={styles.tagBadgeContainer}>
                {taggedEntities.filter((entity) => entity.type === 'car' && entity.index == activeImageIndex).map((entity, index) => (
                    <TaggedEntity
                        key={index}
                        label={entity.label}
                        type={entity.type}
                        onRemove={() => {
                            onTagRemove(entity.arr_idx);
                        }}
                    />
                ))}

                {taggedEntities.filter((entity) => entity.type === 'associated-car').map((entity, index) => (
                    <TaggedEntity
                        key={index}
                        label={entity.label}
                        type={entity.type}
                        canRemove={false}
                        onRemove={() => {
                            onTagRemove(entity.arr_idx);
                        }}
                    />
                ))}
            </View>
        );
    };

    const renderTagEvents = () => {
        return (
            <View style={styles.tagBadgeContainer}>
                {taggedEntities.filter((entity) => entity.type === 'event' && entity.index == activeImageIndex).map((entity, index) => (
                    <TaggedEntity
                        key={index}
                        label={entity.label}
                        type={entity.type}
                        onRemove={() => {
                            onTagRemove(entity.arr_idx);
                            // setTaggedEntities(taggedEntities.filter((_, i) => i !== index));
                        }}
                    />
                ))}
            </View>
        );
    };

    const sections = [
        {
            title: 'Tag Users',
            type: 'user',
            content: renderTagUsers()
        },
        {
            title: 'Tag Registrations',
            type: 'car',
            content: renderTagVehicles()
        },
        {
            title: 'Tag Events',
            type: 'events',
            content: renderTagEvents()
        },
    ];

    const renderCount = (type) => {
        return taggedEntities.filter((entity) => entity.type === type).length;
    };

    function renderHeader(section, activePanel) {

        return (
            <View style={styles.accordHeader}>
                <Text style={styles.accordTitle}>{section.title}</Text>

                {renderContent(section)}

                <TouchableOpacity onPress={() => {
                    setActivePanel(activePanel);
                    toggleSheet();
                }}
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 40,
                        backgroundColor: 'white',
                        borderStyle: 'solid',
                        borderWidth: 1.5,
                        borderColor: '#ae9159',
                        borderRadius: 8,
                        marginTop: 8,
                    }}
                >
                    <Text
                        style={{
                            color: '#ae9159',
                            fontFamily: 'Poppins_500Medium',
                            fontSize: 13,
                        }}>+ Add</Text>
                </TouchableOpacity>
            </View>
        );
    };

    function renderContent(section) {
        return (
            <View style={styles.accordBody}>
                {section.content}
            </View>
        );
    }

    const getTitle = () => {
        switch (activePanel) {
            case 'users':
                return 'Users';
            case 'car':
                return 'Registrations';
            case 'events':
                return 'Events';
            default:
                return 'Users';
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.container}>
                <View style={styles.accordContainer}>
                    {sections.map((section, index) => (
                        <View key={index}>
                            {renderHeader(section, section.type)}
                        </View>
                    ))}
                </View>
            </ScrollView>

            <BottomSheet
                visible={showSheet}
                onClose={() => {
                    setShowSheet(false);
                }}
                activePanel={activePanel}
                title={getTitle()}
            />
        </View>
    );
}

export default Collapsible;

const styles = StyleSheet.create({
    tagBadgeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    shareButton: {
        backgroundColor: '#ae9159',
        padding: 8,
        alignItems: 'center',
        borderRadius: 8,
        fontSize: 12,
        marginBottom: 8,
    },
    shareButtonText: {
        fontSize: 12,
        color: '#fff',
        fontFamily: 'Poppins_500Medium',
    },
    container: {
        flex: 1,
        marginTop: 5,
        backgroundColor: 'white',
        fontFamily: 'Poppins-Bold',
    },
    accordContainer: {
    },
    accordHeader: {
        flex: 1,
        backgroundColor: 'white',
        flexDirection: 'column',
        padding: 12,
        borderTopWidth: .5,
        borderBottomWidth: 1,
        borderColor: '#E1E1E1',
    },
    accordTitle: {
        fontSize: 18,
        fontFamily: 'Poppins_600SemiBold',
    },
    accordBody: {
        marginTop: 7,
        width: '100%',
        height: 'auto',
    },
    textSmall: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 13
    },
    seperator: {
        height: 12
    }
});