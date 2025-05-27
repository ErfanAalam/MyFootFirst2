import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useCart } from '../../contexts/CartContext';

interface LocationData {
    latitude: number;
    longitude: number;
    name: string;
    shopName: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
}

const parseGoogleMapsUrl = (url: string): LocationData | null => {
    const latLngMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    const nameMatch = url.match(/maps\/place\/([^/@]+)/);

    const latitude = latLngMatch ? parseFloat(latLngMatch[1]) : null;
    const longitude = latLngMatch ? parseFloat(latLngMatch[2]) : null;
    const name = nameMatch ? decodeURIComponent(nameMatch[1].replace(/\+/g, ' ')) : 'Unknown';

    if (latitude !== null && longitude !== null) {
        return {
            latitude,
            longitude,
            name,
            shopName: '', // These will be filled in by the form
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            country: ''
        };
    }
    return null;
};

const AdvertizeBusiness: React.FC = () => {
    const [locationUrl, setLocationUrl] = useState('');
    const [shopName, setShopName] = useState('');
    const [addressLine1, setAddressLine1] = useState('');
    const [addressLine2, setAddressLine2] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');
    const [locations, setLocations] = useState<LocationData[]>([]);
    const [error, setError] = useState('');
    const {RetailerId} = useCart();

    const fetchLocations = useCallback(async () => {
        if (!RetailerId) return;

        try {
            const retailerRef = firestore().collection('Retailers').doc(RetailerId.toString());
            const retailerDoc = await retailerRef.get();

            if (retailerDoc.exists) {
                const data = retailerDoc.data();
                setLocations(data?.locations || []);
            }
        } catch (err) {
            console.error('Error fetching locations:', err);
            setError('Failed to fetch locations');
        }
    }, [RetailerId]);

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    const handleAddLocation = async () => {
        if (!RetailerId) {
            setError('User not authenticated');
            return;
        }

        if (!shopName.trim() || !addressLine1.trim() || !city.trim() || !state.trim() || !country.trim()) {
            setError('Please fill in all required fields');
            return;
        }

        const locationData = parseGoogleMapsUrl(locationUrl);
        if (!locationData) {
            setError('Invalid Google Maps URL');
            return;
        }

        const completeLocationData: LocationData = {
            ...locationData,
            shopName: shopName.trim(),
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2.trim(),
            city: city.trim(),
            state: state.trim(),
            country: country.trim(),
        };

        try {
            const retailerRef = firestore().collection('Retailers').doc(RetailerId.toString());
            await retailerRef.update({
                locations: firestore.FieldValue.arrayUnion(completeLocationData)
            });

            setLocations([...locations, completeLocationData]);
            setLocationUrl('');
            setShopName('');
            setAddressLine1('');
            setAddressLine2('');
            setCity('');
            setState('');
            setCountry('');
            setError('');
        } catch (err) {
            console.error('Error adding location:', err);
            setError('Failed to add location');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar 
                barStyle="light-content"
                backgroundColor="#00843D"
                translucent={true}
            />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Advertise Your Business</Text>
            </View>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Shop Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={shopName}
                            onChangeText={setShopName}
                            placeholder="Enter your shop name"
                            placeholderTextColor="#666"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Address Line 1 *</Text>
                        <TextInput
                            style={styles.input}
                            value={addressLine1}
                            onChangeText={setAddressLine1}
                            placeholder="Enter street address"
                            placeholderTextColor="#666"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Address Line 2</Text>
                        <TextInput
                            style={styles.input}
                            value={addressLine2}
                            onChangeText={setAddressLine2}
                            placeholder="Apartment, suite, unit, etc. (optional)"
                            placeholderTextColor="#666"
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>City *</Text>
                            <TextInput
                                style={styles.input}
                                value={city}
                                onChangeText={setCity}
                                placeholder="Enter city"
                                placeholderTextColor="#666"
                            />
                        </View>

                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>State *</Text>
                            <TextInput
                                style={styles.input}
                                value={state}
                                onChangeText={setState}
                                placeholder="Enter state"
                                placeholderTextColor="#666"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Country *</Text>
                        <TextInput
                            style={styles.input}
                            value={country}
                            onChangeText={setCountry}
                            placeholder="Enter country"
                            placeholderTextColor="#666"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Google Maps Location *</Text>
                        <TextInput
                            style={styles.input}
                            value={locationUrl}
                            onChangeText={setLocationUrl}
                            placeholder="Paste Google Maps URL here"
                            placeholderTextColor="#666"
                        />
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={handleAddLocation}
                    >
                        <Text style={styles.buttonText}>Add Location</Text>
                    </TouchableOpacity>

                    <View style={styles.locationsContainer}>
                        <Text style={styles.sectionTitle}>Added Locations:</Text>
                        {locations.map((location, index) => (
                            <View key={index} style={styles.locationItem}>
                                <Text style={styles.locationName}>{location.shopName}</Text>
                                <Text style={styles.locationAddress}>
                                    {location.addressLine1}
                                    {location.addressLine2 ? `, ${location.addressLine2}` : ''}
                                </Text>
                                <Text style={styles.locationAddress}>
                                    {location.city}, {location.state}, {location.country}
                                </Text>
                                <Text style={styles.locationCoords}>
                                    Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#00843D',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        paddingBottom: 15,
        paddingHorizontal: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    contentContainer: {
        padding: 20,
    },
    formContainer: {
        marginTop: 10,
    },
    inputGroup: {
        marginBottom: 15,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    addButton: {
        backgroundColor: '#00843D',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
        fontSize: 14,
    },
    locationsContainer: {
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 15,
        color: '#333',
    },
    locationItem: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    locationName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    locationAddress: {
        fontSize: 14,
        color: '#666',
        marginBottom: 3,
    },
    locationCoords: {
        fontSize: 12,
        color: '#888',
        marginTop: 5,
    },
});

export default AdvertizeBusiness;
