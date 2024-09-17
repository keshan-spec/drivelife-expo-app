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

const TaggedEntity = ({ label, type, onRemove }) => {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8, borderBottomWidth: 1, borderBottomColor: '#ae9159', padding: 8 }}>
            <Text style={styles.textSmall}>{label}</Text>
            <TouchableOpacity onPress={onRemove}>
                <MaterialCommunityIcons name="close" size={16} color="#ae9159" />
            </TouchableOpacity>
        </View>
    );
};

function Collapsible() {
    const [activeSections, setActiveSections] = useState([]);
    const [showSheet, setShowSheet] = useState(false);
    const [activePanel, setActivePanel] = useState('users');

    const { taggedEntities, setTaggedEntities } = usePostProvider();

    const toggleSheet = useCallback(() => {
        setShowSheet(!showSheet);
    }, [showSheet]);

    const renderTagUsers = () => {
        return (
            <View>
                <TouchableOpacity style={styles.shareButton} onPress={() => {
                    setActivePanel('users');
                    toggleSheet();
                }}>
                    <Text style={styles.shareButtonText}>+ Add</Text>
                </TouchableOpacity>
                {taggedEntities.filter((entity) => entity.type === 'user').map((entity, index) => (
                    <TaggedEntity
                        key={index}
                        label={entity.label}
                        type={entity.type}
                        onRemove={() => {
                            setTaggedEntities(taggedEntities.filter((_, i) => i !== index));
                        }}
                    />
                ))}
            </View>
        );
    };

    const renderTagVehicles = () => {
        return (
            <View>
                <TouchableOpacity style={styles.shareButton} onPress={() => {
                    setActivePanel('vehicles');
                    toggleSheet();
                }}>
                    <Text style={styles.shareButtonText}>+ Add</Text>
                </TouchableOpacity>

                {taggedEntities.filter((entity) => entity.type === 'car').map((entity, index) => (
                    <TaggedEntity
                        key={index}
                        label={entity.label}
                        type={entity.type}
                        onRemove={() => {
                            setTaggedEntities(taggedEntities.filter((_, i) => i !== index));
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
            title: 'Tag Vehicle',
            type: 'car',
            content: renderTagVehicles()
        },
    ];

    const renderCount = (type) => {
        return taggedEntities.filter((entity) => entity.type === type).length;
    };

    function renderHeader(section, _, isActive) {
        return (
            <View style={styles.accordHeader}>
                <Text style={styles.accordTitle}>{section.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 20,
                        height: 20,
                        textAlign: 'center',
                        textAlignVertical: 'center', // Android-specific centering
                        lineHeight: 20, // Ensure text is vertically centered
                        borderRadius: 50, // Half of the width/height to make it rounded
                        backgroundColor: taggedEntities.filter((entity) => entity.type === section.type).length ? '#ae9159' : '#bbb',
                    }}>
                        <Text style={{
                            fontSize: 12,
                            color: 'white',
                            fontFamily: 'Poppins_500Medium',
                        }}>
                            {renderCount(section.type)}
                        </Text>
                    </View>
                    <MaterialCommunityIcons name={isActive ? 'chevron-up' : 'chevron-down'} size={20} color="#bbb" />
                </View>
            </View>
        );
    };


    function renderContent(section, _, isActive) {
        return (
            <View style={styles.accordBody}>
                {section.content}
            </View>
        );
    }


    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                style={styles.container}>
                <Accordion
                    align="bottom"
                    sections={sections}
                    activeSections={activeSections}
                    renderHeader={renderHeader}
                    renderContent={renderContent}
                    onChange={(sections) => setActiveSections(sections)}
                    sectionContainerStyle={styles.accordContainer}
                />
            </ScrollView>
            <BottomSheet
                visible={showSheet}
                onClose={() => {
                    setShowSheet(false);
                }}
                activePanel={activePanel}
                onTag={(data) => {
                    toggleSheet();
                    setTaggedEntities([...taggedEntities, ...data]);
                }}
                title={activePanel === 'users' ? 'Tag Users' : 'Tag Vehicles'}
            />
        </SafeAreaView>
    );
}

export default Collapsible;

const styles = StyleSheet.create({
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
        // flex: 1,
        backgroundColor: 'white',
        fontFamily: 'Poppins-Bold',
    },
    accordContainer: {
    },
    accordHeader: {
        flex: 1,
        justifyContent: 'space-between',
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: .5,
        borderBottomWidth: 1,
        borderColor: '#E1E1E1',
    },
    accordTitle: {
        fontSize: 14,
        fontFamily: 'Poppins_500Medium',
    },
    accordBody: {
        padding: 12,
        height: 'auto',
    },
    textSmall: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 14
    },
    seperator: {
        height: 12
    }
});
