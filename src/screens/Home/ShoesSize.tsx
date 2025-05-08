import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../../contexts/UserContext';
import { getFirestore, getDoc, doc, updateDoc } from '@react-native-firebase/firestore';

type RootStackParamList = {
    ShoesSize: {
        answers: any;
        gender: string;
        recommendedInsole: 'Sport' | 'Comfort' | 'Stability';
    };
    InsoleRecommendation: {
        recommendedInsole: 'Sport' | 'Comfort' | 'Stability'
    };
};

type ShoesSizeRouteProp = RouteProp<RootStackParamList, 'ShoesSize'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShoesSize'>;

// Shoe size conversion data
const menSizes = {
    US: [6, 7, 8, 9, 10, 11, 12, 13],
    UK: [5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5],
    EU: [39, 40, 41, 42.5, 44, 45, 46, 47.5],
};

const womenSizes = {
    US: [5, 6, 7, 8, 9, 10, 11, 12],
    UK: [3, 4, 5, 6, 7, 8, 9, 10],
    EU: [36, 37, 38, 39, 40, 41, 42, 43],
};

const ShoesSize = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<ShoesSizeRouteProp>();
    const { user, userData } = useUser();

    const { gender, recommendedInsole, answers } = route.params;

    // State variables
    const [selectedCountry, setSelectedCountry] = useState<'US' | 'UK' | 'EU'>('US');
    const [sizeIndex, setSizeIndex] = useState(3); // Default to middle size (e.g., US 9 for men, US 8 for women)
    const [loading, setLoading] = useState(false);

    // Flag emojis instead of images
    const flagEmojis = {
        US: '🇺🇸',
        UK: '🇬🇧',
        EU: '🇪🇺',
    };

    // Get the appropriate size chart based on gender
    const sizeChart = gender.toLowerCase() === 'male' ? menSizes : womenSizes;

    // Functions to handle size changes
    const incrementSize = () => {
        if (sizeIndex < sizeChart[selectedCountry].length - 1) {
            setSizeIndex(sizeIndex + 1);
        }
    };

    const decrementSize = () => {
        if (sizeIndex > 0) {
            setSizeIndex(sizeIndex - 1);
        }
    };

    // Function to continue to payment
    const handleContinue = async () => {
        try {
            //   setLoading(true);

            // Prepare data to save - just the selected country and size
            const shoeSize = {
                country: selectedCountry,
                size: sizeChart[selectedCountry][sizeIndex]
            };

            console.log(shoeSize)
            console.log(answers)
            // Only proceed if user is authenticated
            if (user) {

                const firestore = getFirestore();
                const userDocRef = doc(firestore, 'users', user.uid);
                console.log(getDoc(userDocRef))

                // Store data directly in Firestore
                // await updateDoc(userDocRef, {
                //     insoleAnswers: {
                //         ...answers,
                //         recommendedInsole,
                //         shoeSize: shoeSize
                //     }
                // });

            } else {
                console.warn('No user logged in, cannot save data');
            }

            console.log(userData)

            // Navigate to recommendation screen

        } catch (error) {
            console.error('Error saving shoe size:', error);
            Alert.alert('Error', 'Failed to save your shoe size. Please try again.');
        } finally {
            setLoading(false);
            navigation.navigate('InsoleRecommendation', {
                recommendedInsole: recommendedInsole,
            });
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.navigationHeader}>
                <IconButton
                    icon="arrow-left"
                    size={24}
                    iconColor="#333"
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                />
                <Text style={styles.navigationTitle}>Select Your Shoe Size</Text>
                <View style={styles.rightPlaceholder} />
            </View>

            <View style={styles.mainContainer}>
                <ScrollView contentContainerStyle={styles.container}>
                    <View style={styles.headerSection}>
                        <Text style={styles.headerTitle}>What's your shoe size?</Text>
                        <Text style={styles.headerSubtitle}>
                            Select your country standard and size
                        </Text>
                    </View>


                    {/* Size selector */}
                    <View style={styles.sizeSelector}>
                        <TouchableOpacity
                            style={styles.sizeButton}
                            onPress={decrementSize}
                            disabled={sizeIndex === 0}
                        >
                            <IconButton icon="minus" size={24} iconColor={sizeIndex === 0 ? '#ccc' : '#333'} />
                        </TouchableOpacity>

                        <View style={styles.sizeDisplay}>
                            <Text style={styles.currentSize}>{sizeChart[selectedCountry][sizeIndex]}</Text>
                            <Text style={styles.sizeLabel}>{selectedCountry}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.sizeButton}
                            onPress={incrementSize}
                            disabled={sizeIndex === sizeChart[selectedCountry].length - 1}
                        >
                            <IconButton
                                icon="plus"
                                size={24}
                                iconColor={sizeIndex === sizeChart[selectedCountry].length - 1 ? '#ccc' : '#333'}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Country selection flags */}
                    <View style={styles.flagContainer}>
                        {Object.keys(sizeChart).map((country) => (
                            <TouchableOpacity
                                key={country}
                                style={[
                                    styles.flagButton,
                                    selectedCountry === country && styles.selectedFlagButton,
                                ]}
                                onPress={() => setSelectedCountry(country as 'US' | 'UK' | 'EU')}
                            >
                                <Text style={styles.flagEmoji}>{flagEmojis[country as keyof typeof flagEmojis]}</Text>
                                <Text style={[
                                    styles.flagText,
                                    selectedCountry === country && styles.selectedFlagText,
                                ]}>
                                    {country}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Size comparison table */}
                    <View style={styles.sizeTableContainer}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.tableHeaderText}>US</Text>
                            <Text style={styles.tableHeaderText}>UK</Text>
                            <Text style={styles.tableHeaderText}>EU</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>{sizeChart.US[sizeIndex]}</Text>
                            <Text style={styles.tableCell}>{sizeChart.UK[sizeIndex]}</Text>
                            <Text style={styles.tableCell}>{sizeChart.EU[sizeIndex]}</Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Continue button positioned at bottom */}
                <View style={styles.bottomButtonContainer}>
                    <TouchableOpacity
                        style={[styles.buttonContainer, loading && styles.buttonDisabled]}
                        onPress={handleContinue}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Saving...' : 'Get Insole Recommendation'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    navigationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    backButton: {
        margin: 0,
    },
    navigationTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    rightPlaceholder: {
        width: 40,
    },
    container: {
        padding: 20,
        paddingBottom: 100,
    },
    headerSection: {
        marginBottom: 30,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    flagContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 60,
        paddingHorizontal: 20,
    },
    flagButton: {
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#eee',
        width: 80,
    },
    selectedFlagButton: {
        borderColor: '#00843D',
        backgroundColor: 'rgba(0, 132, 61, 0.05)',
    },
    flagEmoji: {
        fontSize: 32,
        marginBottom: 5,
    },
    flagText: {
        fontSize: 14,
        color: '#333',
    },
    selectedFlagText: {
        color: '#00843D',
        fontWeight: 'bold',
    },
    sizeSelector: {
        flexDirection: 'row',
        marginTop: 40,
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
    },
    sizeButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
        height: 50,
    },
    sizeDisplay: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#00843D',
        borderRadius: 15,
        padding: 15,
        width: 150,
        height: 150,
        backgroundColor: 'rgba(0, 132, 61, 0.05)',
    },
    currentSize: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#00843D',
    },
    sizeLabel: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
    },
    conversionInfo: {
        backgroundColor: '#f9f9f9',
        padding: 20,
        borderRadius: 10,
        marginBottom: 30,
    },
    conversionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    conversionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    conversionLabel: {
        fontSize: 16,
        color: '#666',
    },
    conversionValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    buttonContainer: {
        backgroundColor: '#00843D',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    mainContainer: {
        flex: 1,
        position: 'relative',
    },
    bottomButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    sizeTableContainer: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 40,
        // marginTop: 20,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    tableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#f9f9f9',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tableHeaderText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 15,
    },
    tableCell: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '500',
        color: '#00843D',
    },
});

export default ShoesSize;
