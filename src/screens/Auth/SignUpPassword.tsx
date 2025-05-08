import React, { useState } from 'react';
import {
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Alert,
} from 'react-native';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';

const SignUpPassword = ({ route }: { route: any }) => {
    const navigation = useNavigation<NavigationProp<ParamListBase>>();

    const [businessName, setBusinessName] = useState(route.params.businessName);
    const [businessType, setBusinessType] = useState(route.params.businessType);

    const [contactFirstName, setContactFirstName] = useState(route.params.contactFirstName);
    const [contactLastName, setContactLastName] = useState(route.params.contactLastName);
    const [contactRole, setContactRole] = useState(route.params.contactRole);
    const [email, setEmail] = useState(route.params.email);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [address, setAddress] = useState(route.params.address);
    const [city, setCity] = useState(route.params.city);
    const [state, setState] = useState(route.params.state);
    const [postalCode, setPostalCode] = useState(route.params.postalCode);
    const [countryCode, setCountryCode] = useState(route.params.countryCode);
    const [callingCode, setCallingCode] = useState(route.params.callingCode);
    const [country, setCountry] = useState(route.params.country);
    const [phone, setPhone] = useState(route.params.phone);



    const validateForm = () => {

        if (!password || !confirmPassword) {
            Alert.alert("Validation Error", "All required fields must be filled.");
            return false;
        }

        if (password.length < 6) {
            Alert.alert("Weak Password", "Password must be at least 6 characters.");
            return false;
        }
        if (password !== confirmPassword) {
            Alert.alert("Password Mismatch", "Password and Confirm Password must match.");
            return false;
        }
        return true;
    };



    const handleSubmit = async () => {
        // Validate form before proceeding
        if (!validateForm()) return;

        try {
            // Navigate to next screen
            navigation.navigate('SignUpDone', {
                businessName,
                businessType,
                contactFirstName,
                contactLastName,
                contactRole,
                email,
                password,
                address,
                city,
                state,
                postalCode,
                countryCode,
                callingCode,
                country,
                phone,
            });

        } catch (error) {
            console.error('Error during registration:', error);
            Alert.alert("Registration Failed", (error as Error).message);
        }
    };





    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Set Your Password</Text>


                <TextInput
                    placeholder="Password*"
                    placeholderTextColor="#999"
                    style={styles.input}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <TextInput
                    placeholder="Confirm Password*"
                    placeholderTextColor="#999"
                    style={styles.input}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />



                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitButtonText}>Continue</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 15,
        color: '#000',
    },
    submitButton: {
        backgroundColor: '#00843D',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    inputText: {
        color: '#333',
    },
    placeholderText: {
        color: '#999',
    },

});

export default SignUpPassword;