import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import { Alert } from 'react-native';

// Define navigation types
type RootStackParamList = {
    Welcome: undefined;
    Login: undefined;
    MainTabs: undefined;
    Home: undefined;
    EmployeLogin: undefined;
};

const EmployeeEmail = ({ route }: { route: any }) => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [retailerId, setRetailerId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (route.params?.retailerId) {
            setRetailerId(route.params.retailerId);
        }
    }, [route.params?.retailerId]);

    const hadnleEmailverify = async () => {
        if (!retailerId.trim() || !email.trim()) {
            Alert.alert('Validation Error', 'Retailer ID and Email are required.');
            return;
        }

        try {
            const docRef = firestore().collection('Retailers').doc(retailerId.trim());
            const docSnap = await docRef.get();

            if (!docSnap.exists) {
                Alert.alert('Retailer Not Found', 'Retailer ID does not exist.');
                return;
            }

            const data = docSnap.data();
            const employeeList: string[] = data?.employees || [];

            const matchedEmployee = employeeList.find(
                (employee: any) => employee.email.toLowerCase() === email.trim().toLowerCase()
            );

            if (matchedEmployee) {
                console.log('Employee email verified');
                navigation.navigate('EmployeePassword', { retailerId: retailerId.trim(), employee: matchedEmployee, });// Or your next screen
            } else {
                Alert.alert('Email Not Found', 'This email is not registered under this retailer.');
            }
        } catch (error) {
            console.error('Error verifying email:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.formContainer}>

                <Text style={styles.inputLabel}>Enter Your Email</Text>
                <TextInput
                    style={styles.input}
                    placeholder=""
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                />


                <TouchableOpacity style={styles.loginButton} onPress={hadnleEmailverify}>
                    <Text style={styles.loginButtonText}>Continue</Text>
                </TouchableOpacity>

            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Employee access is restricted to authorized personnel only.
                </Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    formContainer: {
        padding: 16,
    },
    inputLabel: {
        fontSize: 16,
        color: '#757575',
        marginBottom: 4,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        color: 'black',
        borderRadius: 4,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    loginButton: {
        backgroundColor: '#00843D',
        borderRadius: 4,
        padding: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    backContainer: {
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 16,
    },
    backText: {
        color: '#757575',
        fontSize: 14,
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
        padding: 16,
    },
    footerText: {
        fontSize: 12,
        color: '#9E9E9E',
        textAlign: 'center',
    },
});

export default EmployeeEmail; 