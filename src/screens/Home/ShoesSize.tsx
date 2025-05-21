import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../../contexts/UserContext';
import CustomAlertModal from '../../Components/CustomAlertModal';
import firestore from '@react-native-firebase/firestore';

type RootStackParamList = {
    ShoesSize: {
        answers: any;
        gender: string;
        customer: any;
        RetailerId: string;
        recommendedInsole: 'Sport' | 'Comfort' | 'Stability';
    };
    InsoleRecommendation: {
        recommendedInsole: 'Sport' | 'Comfort' | 'Stability',
        shoeSize: {
            country: string;
            size: number;
        };
    };
};

type ShoesSizeRouteProp = RouteProp<RootStackParamList, 'ShoesSize'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShoesSize'>;

// Shoe size conversion data
const menSizes = {
    US: [6, 7, 8, 9, 10, 11, 12, 13],
    UK: [5, 6, 7, 8, 9, 10, 11, 12],
    EU: [39, 40, 41, 42.5, 44, 45, 46, 47.5],
};

const womenSizes = {
    US: [5, 6, 7, 8, 9, 10, 11, 12],
    UK: [3, 4, 5, 6, 7, 8, 9, 10],
    EU: [36, 37, 38, 39, 40, 41, 42, 43],
};

// Foot length ranges in cm for men and women
const menFootLengthRanges = [
    { min: 24.0, max: 24.5, sizeIndex: 0 },  // US 6
    { min: 24.6, max: 25.2, sizeIndex: 1 },  // US 7
    { min: 25.3, max: 26.0, sizeIndex: 2 },  // US 8
    { min: 26.1, max: 26.7, sizeIndex: 3 },  // US 9
    { min: 26.8, max: 27.4, sizeIndex: 4 },  // US 10
    { min: 27.5, max: 28.0, sizeIndex: 5 },  // US 11
    { min: 28.1, max: 28.7, sizeIndex: 6 },  // US 12
    { min: 28.8, max: 29.4, sizeIndex: 7 },  // US 13
];

const womenFootLengthRanges = [
    { min: 22.0, max: 22.5, sizeIndex: 0 },  // US 5
    { min: 22.6, max: 23.2, sizeIndex: 1 },  // US 6
    { min: 23.3, max: 23.9, sizeIndex: 2 },  // US 7
    { min: 24.0, max: 24.5, sizeIndex: 3 },  // US 8
    { min: 24.6, max: 25.2, sizeIndex: 4 },  // US 9
    { min: 25.3, max: 26.0, sizeIndex: 5 },  // US 10
    { min: 26.1, max: 26.7, sizeIndex: 6 },  // US 11
    { min: 26.8, max: 27.4, sizeIndex: 7 },  // US 12
];

const ShoesSize = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<ShoesSizeRouteProp>();
    const { user } = useUser();

    const { gender, recommendedInsole, answers, customer, RetailerId } = route.params;

    // State variables
    const [selectedCountry, setSelectedCountry] = useState<'US' | 'UK' | 'EU'>('US');
    const [sizeIndex, setSizeIndex] = useState(3); // Will be updated based on foot length
    const [loading, setLoading] = useState(true);
    const [alertModal, setAlertModal] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'info',
    });

    // Flag emojis instead of images
    const flagEmojis = {
        US: '🇺🇸',
        UK: '🇬🇧',
        EU: '🇪🇺',
    };

    // Get the appropriate size chart based on gender
    const sizeChart = gender.toLowerCase() === 'male' ? menSizes : womenSizes;

    // Function to get recommended size index based on foot length
    const getRecommendedSizeIndex = useCallback((footLengthCm: number, isMale: boolean) => {
        const ranges = isMale ? menFootLengthRanges : womenFootLengthRanges;
        const range = ranges.find(r => footLengthCm >= r.min && footLengthCm <= r.max);
        return range ? range.sizeIndex : 3; // Default to middle size if no match found
    }, []);

    // Function to fetch latest measurements
    const fetchLatestMeasurements = useCallback(async () => {
        if (!user?.uid) return;

        try {
            const measurementsRef = firestore().collection('Retailers').doc(RetailerId).collection('measurements').doc(customer.id);
            const docSnapshot = await measurementsRef.get();

            if (docSnapshot.exists) {
                const measurements = docSnapshot.data()?.measurements;

                // Convert foot length from meters to centimeters
                const leftFootLengthCm = measurements.left_length * 100;
                const rightFootLengthCm = measurements.right_length * 100;

                // Use the larger foot length for recommendation
                const footLengthCm = Math.max(leftFootLengthCm, rightFootLengthCm);

                // Get recommended size index based on foot length
                const recommendedIndex = getRecommendedSizeIndex(
                    footLengthCm,
                    gender.toLowerCase() === 'male'
                );

                setSizeIndex(recommendedIndex);
            }
        } catch (error) {
            console.error('Error fetching measurements:', error);
            showAlert('Error', 'Failed to fetch your measurements. Using default size.', 'error');
        } finally {
            setLoading(false);
        }
    }, [user?.uid, gender, getRecommendedSizeIndex]);

    useEffect(() => {
        fetchLatestMeasurements();
    }, [fetchLatestMeasurements]);

    // Functions to handle size changes
    const incrementSize = () => {
        // console.log(sizeIndex)
        if (sizeIndex < sizeChart[selectedCountry].length - 1) {
            setSizeIndex(sizeIndex + 1);
        }
    };

    const decrementSize = () => {
        if (sizeIndex > 0) {
            setSizeIndex(sizeIndex - 1);
        }
    };

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setAlertModal({
            visible: true,
            title,
            message,
            type,
        });
    };

    const hideAlert = () => {
        setAlertModal(prev => ({ ...prev, visible: false }));
    };

    const handleSaveSize = async () => {
        try {
            setLoading(true);

            // Prepare data to save - combine questionnaire answers and shoe size
            const dataToSave = {
                Questionnaire: {
                    ...answers,
                    timestamp: firestore.FieldValue.serverTimestamp(),
                },
                ShoeSize: {
                    country: selectedCountry,
                    size: sizeChart[selectedCountry][sizeIndex],
                    timestamp: firestore.FieldValue.serverTimestamp(),
                }
            };

            // Save to Firestore
            if (user?.uid) {
                const userRef = firestore().collection('users').doc(user.uid);
                await userRef.set(dataToSave, { merge: true });
                console.log('Data saved to Firestore successfully');

                // Navigate to recommendation screen
                navigation.navigate('InsoleRecommendation', {
                    recommendedInsole: recommendedInsole,
                    shoeSize: {
                        country: selectedCountry,
                        size: sizeChart[selectedCountry][sizeIndex]
                    },
                });
            } else {
                console.error('No user ID available');
                showAlert('Error', 'Unable to save your data. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error saving data:', error);
            showAlert('Error', 'Failed to save your data. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    console.log(sizeIndex)

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
                            {loading ? 'Loading your recommended size...' : 'Select your country standard and size'}
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
                        onPress={handleSaveSize}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Saving...' : 'Get Insole Recommendation'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
            <CustomAlertModal
                visible={alertModal.visible}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
                onClose={hideAlert}
            />
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
