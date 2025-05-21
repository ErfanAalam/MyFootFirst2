import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import { useUser } from '../contexts/UserContext';

interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    country: string;
    phoneNumber: string;
    gender: 'male' | 'female';
}

interface CustomerDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    onCustomerSelect: (customer: Customer) => void;
    onNewCustomerSubmit: (customer: Customer) => void;
}

interface AlertModalProps {
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ visible, title, message, type, onClose }) => (
    <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
    >
        <View style={styles.alertOverlay}>
            <View style={[styles.alertContainer, type === 'error' ? styles.errorAlert : styles.successAlert]}>
                <Text style={styles.alertTitle}>{title}</Text>
                <Text style={styles.alertMessage}>{message}</Text>
                <TouchableOpacity
                    style={[styles.button, styles.alertButton]}
                    onPress={onClose}
                >
                    <Text style={styles.buttonText}>OK</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
);

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
    visible,
    onClose,
    onCustomerSelect,
    onNewCustomerSubmit,
}) => {
    const [isEmployeeLoggedIn, setIsEmployeeLoggedIn] = useState(false);
    const [retailerId, setRetailerId] = useState('');
    const [showCustomerTypeModal, setShowCustomerTypeModal] = useState(true);
    const [showCustomerList, setShowCustomerList] = useState(false);
    const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);

    // Form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [addressLine1, setAddressLine1] = useState('');
    const [addressLine2, setAddressLine2] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [showGenderDropdown, setShowGenderDropdown] = useState(false);

    const { userData } = useUser();

    const [alertModal, setAlertModal] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'info'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const checkEmployeeStatus = useCallback(async () => {
        try {
            const isEmployee = await AsyncStorage.getItem('isEmployeeLoggedIn');
            setIsEmployeeLoggedIn(isEmployee === 'true');
        } catch (error) {
            console.error('Error checking employee status:', error);
        }
    }, []);

    useEffect(() => {
        const initializeRetailerId = async () => {
            if (userData?.RetailerId) {
                setRetailerId(userData.RetailerId.toString());
            } else {
                const storedRetailerId = await AsyncStorage.getItem('RetailerId');
                if (storedRetailerId) {
                    setRetailerId(storedRetailerId);
                }
            }
        };

        initializeRetailerId();
        checkEmployeeStatus();
    }, [userData, checkEmployeeStatus]);

    const fetchCustomers = async () => {
        if (!retailerId) return;

        setLoading(true);
        try {
            const retailerDoc = await firestore()
                .collection('Retailers')
                .doc(retailerId)
                .get();

            const retailerData = retailerDoc.data();
            if (retailerData?.customers) {
                setCustomers(retailerData.customers);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExistingCustomer = () => {
        setShowCustomerTypeModal(false);
        setShowCustomerList(true);
        fetchCustomers();
    };

    const handleNewCustomer = () => {
        setShowCustomerTypeModal(false);
        setShowNewCustomerForm(true);
    };

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info') => {
        setAlertModal({
            visible: true,
            title,
            message,
            type
        });
    };

    const validateForm = (): boolean => {
        if (!firstName.trim()) {
            showAlert('Validation Error', 'First name is required', 'error');
            return false;
        }
        if (!lastName.trim()) {
            showAlert('Validation Error', 'Last name is required', 'error');
            return false;
        }
        if (!gender) {
            showAlert('Validation Error', 'Gender is required', 'error');
            return false;
        }
        if (!addressLine1.trim()) {
            showAlert('Validation Error', 'Address line 1 is required', 'error');
            return false;
        }
        if (!city.trim()) {
            showAlert('Validation Error', 'City is required', 'error');
            return false;
        }
        if (!country.trim()) {
            showAlert('Validation Error', 'Country is required', 'error');
            return false;
        }
        if (!phoneNumber.trim()) {
            showAlert('Validation Error', 'Phone number is required', 'error');
            return false;
        }
        if (!/^\+?[\d\s-]{10,}$/.test(phoneNumber)) {
            showAlert('Validation Error', 'Please enter a valid phone number', 'error');
            return false;
        }
        return true;
    };

    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setAddressLine1('');
        setAddressLine2('');
        setCity('');
        setCountry('');
        setPhoneNumber('');
        setGender('male');
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        const newCustomer: Customer = {
            id: Date.now().toString(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            addressLine1: addressLine1.trim(),
            addressLine2: addressLine2.trim(),
            city: city.trim(),
            country: country.trim(),
            phoneNumber: phoneNumber.trim(),
            gender: gender,
        };

        if (isEmployeeLoggedIn || retailerId) {
            try {
                const retailerRef = firestore().collection('Retailers').doc(retailerId);
                await retailerRef.update({
                    customers: firestore.FieldValue.arrayUnion(newCustomer),
                    updatedAt: firestore.FieldValue.serverTimestamp(),
                });

                // Verify the update was successful
                const updatedDoc = await retailerRef.get();
                const updatedData = updatedDoc.data();
                if (!updatedData?.customers?.some((c: Customer) => c.id === newCustomer.id)) {
                    throw new Error('Customer was not properly added to Firestore');
                }

                showAlert('Success', 'Customer added successfully', 'success');
                resetForm();
                setShowCustomerTypeModal(true);
                setShowNewCustomerForm(false);
                onNewCustomerSubmit(newCustomer);
            } catch (error) {
                console.error('Error saving customer to Firestore:', error);
                showAlert('Error', 'Failed to save customer. Please try again.', 'error');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const filteredCustomers = customers.filter(customer => {
        const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
    });

    const renderCustomerTypeModal = () => (
        <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Customer Type</Text>
            <TouchableOpacity
                style={styles.button}
                onPress={handleExistingCustomer}
            >
                <Text style={styles.buttonText}>Existing Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.button}
                onPress={handleNewCustomer}
            >
                <Text style={styles.buttonText}>New Customer</Text>
            </TouchableOpacity>
        </View>
    );

    const renderCustomerList = () => (
        <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Customer</Text>
            {loading ? (
                <Text style={styles.messageText}>Loading customers...</Text>
            ) : customers.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                    <Text style={styles.messageText}>No existing customers found</Text>
                    <TouchableOpacity
                        style={[styles.button]}
                        onPress={() => {
                            setShowCustomerList(false);
                            setShowCustomerTypeModal(true);
                        }}
                    >
                        <Text style={styles.buttonText}>Back to Selection</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search customers..."
                            value={searchQuery}
                            onChangeText={(text) => {
                                setSearchQuery(text);
                                setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            placeholderTextColor="#666"
                        />
                        <TouchableOpacity
                            style={styles.dropdownToggle}
                            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <Icon 
                                name={isDropdownOpen ? "chevron-up" : "chevron-down"} 
                                size={20} 
                                color="#666" 
                            />
                        </TouchableOpacity>
                    </View>
                    
                    {isDropdownOpen && (
                        <View style={styles.dropdownContainer}>
                            <FlatList
                                data={filteredCustomers}
                                keyExtractor={(item) => item.id}
                                style={styles.dropdownList}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.customerItem}
                                        onPress={() => {
                                            onCustomerSelect(item);
                                            setIsDropdownOpen(false);
                                            setSearchQuery('');
                                        }}
                                    >
                                        <Text style={styles.customerName}>
                                            {item.firstName} {item.lastName}
                                        </Text>
                                        <Text style={styles.customerPhone}>{item.phoneNumber}</Text>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <Text style={styles.messageText}>No customers found</Text>
                                }
                            />
                        </View>
                    )}
                    
                    <TouchableOpacity
                        style={[styles.button]}
                        onPress={() => {
                            setShowCustomerList(false);
                            setShowCustomerTypeModal(true);
                            setSearchQuery('');
                            setIsDropdownOpen(false);
                        }}
                    >
                        <Text style={styles.buttonText}>Back to Selection</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );

    const renderNewCustomerForm = () => (
        <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Customer Details</Text>
            <TextInput
                style={styles.input}
                placeholder="First Name*"
                value={firstName}
                onChangeText={setFirstName}
                placeholderTextColor="#000000"
            />
            <TextInput
                style={styles.input}
                placeholder="Last Name*"
                value={lastName}
                onChangeText={setLastName}
                placeholderTextColor="#000000"
            />
            <View style={styles.dropdownContainer}>
                <TouchableOpacity
                    style={styles.genderDropdown}
                    onPress={() => setShowGenderDropdown(!showGenderDropdown)}
                >
                    <Text style={styles.genderDropdownText}>
                        Gender: {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Text>
                    <Icon 
                        name={showGenderDropdown ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="#666" 
                    />
                </TouchableOpacity>
                {showGenderDropdown && (
                    <View style={styles.genderOptions}>
                        <TouchableOpacity
                            style={styles.genderOption}
                            onPress={() => {
                                setGender('male');
                                setShowGenderDropdown(false);
                            }}
                        >
                            <Text style={styles.genderOptionText}>Male</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.genderOption}
                            onPress={() => {
                                setGender('female');
                                setShowGenderDropdown(false);
                            }}
                        >
                            <Text style={styles.genderOptionText}>Female</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
            <TextInput
                style={styles.input}
                placeholder="Address Line 1*"
                value={addressLine1}
                onChangeText={setAddressLine1}
                placeholderTextColor="#000000"
            />
            <TextInput
                style={styles.input}
                placeholder="Address Line 2"
                value={addressLine2}
                onChangeText={setAddressLine2}
                placeholderTextColor="#000000"
            />
            <TextInput
                style={styles.input}
                placeholder="City*"
                value={city}
                onChangeText={setCity}
                placeholderTextColor="#000000"
            />
            <TextInput
                style={styles.input}
                placeholder="Country*"
                value={country}
                onChangeText={setCountry}
                placeholderTextColor="#000000"
            />
            <TextInput
                style={styles.input}
                placeholder="Phone Number*"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                placeholderTextColor="#000000"
            />
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.backButton]}
                    onPress={() => { setShowCustomerTypeModal(true); setShowNewCustomerForm(false); }}
                    disabled={isSubmitting}
                >
                    <Text style={styles.buttonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.submitButton]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>Submit</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    return (
        <>
            <Modal
                visible={visible}
                transparent
                animationType="slide"
                onRequestClose={onClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Icon name="times" size={24} color="#000" />
                        </TouchableOpacity>
                        {showCustomerTypeModal && renderCustomerTypeModal()}
                        {showCustomerList && renderCustomerList()}
                        {showNewCustomerForm && renderNewCustomerForm()}
                    </View>
                </View>
            </Modal>
            <AlertModal
                visible={alertModal.visible}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
                onClose={() => setAlertModal(prev => ({ ...prev, visible: false }))}
            />
        </>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        width: '90%',
        maxHeight: '80%',
        position: 'relative',
    },
    modalContent: {
        padding: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#00843D',
        padding: 15,
        borderRadius: 8,
        marginBottom: 12,
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    backButton: {
        backgroundColor: '#666',
        flex: 1,
        marginRight: 8,
    },
    submitButton: {
        flex: 1,
        marginLeft: 8,
    },
    closeButton: {
        position: 'absolute',
        right: 10,
        top: 10,
        zIndex: 1,
    },
    customerItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
    },
    customerPhone: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    messageText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    alertOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        width: '80%',
        maxWidth: 400,
    },
    errorAlert: {
        borderLeftWidth: 4,
        borderLeftColor: '#ff3b30',
    },
    successAlert: {
        borderLeftWidth: 4,
        borderLeftColor: '#34c759',
    },
    alertTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    alertMessage: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        color: '#666',
    },
    alertButton: {
        marginTop: 10,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: 'white',
    },
    searchInput: {
        flex: 1,
        padding: 12,
        fontSize: 16,
        color: '#000',
    },
    dropdownToggle: {
        padding: 12,
        borderLeftWidth: 1,
        borderLeftColor: '#ddd',
    },
    dropdownContainer: {
        maxHeight: 300,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: 'white',
        marginBottom: 5,
    },
    dropdownList: {
        maxHeight: 300,
    },
    genderDropdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        backgroundColor: 'white',
    },
    genderDropdownText: {
        fontSize: 16,
        color: '#000',
    },
    genderOptions: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        zIndex: 1000,
        marginTop: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    genderOption: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    genderOptionText: {
        fontSize: 16,
        color: '#000',
    },
});

export default CustomerDetailsModal; 