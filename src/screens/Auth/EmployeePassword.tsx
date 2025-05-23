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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../../contexts/UserContext';

// Define navigation types
type RootStackParamList = {
    Welcome: undefined;
    Login: undefined;
    MainTabs: undefined;
    Home: undefined;
    EmployeLogin: undefined;
    EmployeeEmail: undefined;
    EmployeePassword: undefined;
};

type Employee = {
    email: string;
    password: string;
    confirmPassword: string;
};

const EmployeePassword = ({ route }: { route: any }) => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [retailerId, setRetailerId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [employee, setEmployee] = useState<Employee | null>(null);
    const { setIsLoggedIn } = useUser();

    useEffect(() => {
        if (route.params?.retailerId && route.params?.employee) {
            setRetailerId(route.params.retailerId);
            setEmployee(route.params.employee);
            setEmail(route.params.employee.email);
        }
    }, [route.params?.retailerId, route.params?.employee]);

    const hadnlePasswordverify = async () => {
        if (!retailerId.trim() || !email.trim() || !password.trim()) {
            Alert.alert('Validation Error', 'Retailer ID, Email, and Password are required.');
            return;
        }

        try {
            const docRef = firestore().collection('Retailers').doc(retailerId.trim());
            const docSnap = await docRef.get();


            const data = docSnap.data();
            const employeeList: string[] = data?.employees || [];

            const matchedEmployeeIndex = employeeList.findIndex(
                (emp: any) => emp.email.toLowerCase() === email.trim().toLowerCase()
            );

            if (matchedEmployeeIndex === -1) {
                Alert.alert('Email Not Found', 'This email is not registered under this retailer.');
                return;
            }

            const matchedEmployee = employeeList[matchedEmployeeIndex];

            if (matchedEmployee.password) {
                // Password already set, verify it
                if (matchedEmployee.password === password.trim()) {
                    console.log('Password verified successfully');
                    await AsyncStorage.setItem('isEmployeeLoggedIn', 'true');
                    setIsLoggedIn(true);
                    await AsyncStorage.setItem('employeeData', JSON.stringify(matchedEmployee));
                    await AsyncStorage.setItem('Retailerid', JSON.stringify(retailerId));
                    // navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
                } else {
                    Alert.alert('Incorrect Password', 'The password you entered is incorrect.');
                }
            } else {
                // Password not set, save it
                matchedEmployee.password = password.trim();
                employeeList[matchedEmployeeIndex] = matchedEmployee;

                // Update Firestore
                await docRef.update({ employees: employeeList });

                Alert.alert('Password Set', 'Your password has been set successfully.');
                await AsyncStorage.setItem('isEmployeeLoggedIn', 'true');
                setIsLoggedIn(true);
                await AsyncStorage.setItem('employeeData', JSON.stringify(matchedEmployee));
                await AsyncStorage.setItem('Retailerid', JSON.stringify(retailerId));
                // navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
            }
        } catch (error) {
            console.error('Error verifying email:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.formContainer}>

                <Text style={styles.inputLabel}>Enter Your Password</Text>
                <TextInput
                    style={styles.input}
                    placeholder=""
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                />
                {
                    !employee?.password ? (
                        <>
                            <Text style={styles.inputLabel}>Confirm Your Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder=""
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                autoCapitalize="none"
                            />
                        </>
                    ) : ""}


                <TouchableOpacity style={styles.loginButton} onPress={hadnlePasswordverify}>
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

export default EmployeePassword; 