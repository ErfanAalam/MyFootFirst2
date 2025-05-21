import React, { useState } from 'react';
import {
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import CustomAlertModal from '../../Components/CustomAlertModal';

const SignUpPassword = ({ route }: { route: any }) => {
    const navigation = useNavigation<NavigationProp<ParamListBase>>();
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        title: string;
        message: string;
        type: 'success' | 'error' | 'info';
    }>({
        title: '',
        message: '',
        type: 'info',
    });

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setAlertConfig({ title, message, type });
        setAlertVisible(true);
    };

    // Store route params without setters since they're not modified
    const {
        businessName,
        businessType,
        contactFirstName,
        contactLastName,
        contactRole,
        email,
        address,
        city,
        state,
        postalCode,
        countryCode,
        callingCode,
        country,
        phone,
    } = route.params;

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const validateForm = () => {
        if (!password || !confirmPassword) {
            showAlert("Validation Error", "All required fields must be filled.", 'error');
            return false;
        }

        if (password.length < 6) {
            showAlert("Weak Password", "Password must be at least 6 characters.", 'error');
            return false;
        }
        if (password !== confirmPassword) {
            showAlert("Password Mismatch", "Password and Confirm Password must match.", 'error');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
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
            showAlert("Registration Failed", (error as Error).message, 'error');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <CustomAlertModal
                visible={alertVisible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertVisible(false)}
            />
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