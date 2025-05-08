import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import CountryPicker from 'react-native-country-picker-modal';

const SignupDetails = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [showBusinessTypeDropdown, setShowBusinessTypeDropdown] = useState(false);

  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [email, setEmail] = useState('');

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [countryCode, setCountryCode] = useState();
  const [callingCode, setCallingCode] = useState();
  const [country, setCountry] = useState(null);
  const [phone, setPhone] = useState('');


  const onSelectCountry = (country: any) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
    setCountry(country.name);
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!businessName || !businessType || !contactFirstName || !contactLastName || !contactRole || !email || !address || !city || !state || !postalCode || !country || !countryCode || !callingCode || !phone ) {
      Alert.alert("Validation Error", "All required fields must be filled.");
      return false;
    }
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return false;
    }

    return true;
  };



  const handleSubmit = async () => {
    // Validate form before proceeding
    if (!validateForm()) return;

    try {
      navigation.navigate('SignUpPassword',{
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
        country,
        countryCode,
        callingCode,
        phone,
      });


    } catch (error) {
      console.error('Error during registration:', error);
      Alert.alert("Registration Failed", (error as Error).message);
    }
  };


  // Handle business type selection
  const handleBusinessTypeSelect = (selectedType: string) => {
    setBusinessType(selectedType);
    setShowBusinessTypeDropdown(false);
  };

 

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Business Information</Text>

        <TextInput
          placeholder="Business Name*"
          placeholderTextColor="#999"
          style={styles.input}
          value={businessName}
          onChangeText={setBusinessName}
        />

        {/* Business Type Dropdown */}
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowBusinessTypeDropdown(true)}
        >
          <Text style={businessType ? styles.inputText : styles.placeholderText}>
            {businessType ? businessType : 'Business Type (Doctor/Pharmacy/Shoe Store)*'}
          </Text>
        </TouchableOpacity>

        {/* Business Type Modal */}
        <Modal
          visible={showBusinessTypeDropdown}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowBusinessTypeDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowBusinessTypeDropdown(false)}
          >
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownTitle}>Select Business Type</Text>
              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => handleBusinessTypeSelect('Doctor')}
              >
                <Text style={styles.dropdownOptionText}>Doctor</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => handleBusinessTypeSelect('Pharmacy')}
              >
                <Text style={styles.dropdownOptionText}>Pharmacy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => handleBusinessTypeSelect('Shoe Store')}
              >
                <Text style={styles.dropdownOptionText}>Shoe Store</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownCancelButton}
                onPress={() => setShowBusinessTypeDropdown(false)}
              >
                <Text style={styles.dropdownCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <TextInput
          placeholder="Contact Person First Name*"
          placeholderTextColor="#999"
          style={styles.input}
          value={contactFirstName}
          onChangeText={setContactFirstName}
        />


        <TextInput
          placeholder="Contact Person Last Name*"
          placeholderTextColor="#999"
          style={styles.input}
          value={contactLastName}
          onChangeText={setContactLastName}
        />

        <TextInput
          placeholder="Contact Person Role*"
          placeholderTextColor="#999"
          style={styles.input}
          value={contactRole}
          onChangeText={setContactRole}
        />

        <TextInput
          placeholder="Email Address*"
          placeholderTextColor="#999"
          style={styles.input}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />


        <TextInput
          placeholder="Business Address*"
          placeholderTextColor="#999"
          style={styles.input}
          value={address}
          onChangeText={setAddress}
        />

        <TextInput
          placeholder="City*"
          placeholderTextColor="#999"
          style={styles.input}
          value={city}
          onChangeText={setCity}
        />

        <TextInput
          placeholder="State/Province*"
          placeholderTextColor="#999"
          style={styles.input}
          value={state}
          onChangeText={setState}
        />

        <TextInput
          placeholder="Postal/Zip Code*"
          placeholderTextColor="#999"
          style={styles.input}
          value={postalCode}
          onChangeText={setPostalCode}
        />

        <View style={styles.countryRow}>
          <CountryPicker
            withFilter
            withFlag
            withCountryNameButton
            withAlphaFilter
            withCallingCode
            onSelect={onSelectCountry}
            countryCode={countryCode as any}
          />
        </View>

        <View style={styles.phoneRow}>
          <Text style={styles.codeText}>+{callingCode}</Text>
          <TextInput
            placeholder="Phone Number (optional)"
            placeholderTextColor="#999"
            style={styles.phoneInput}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

      

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
  countryRow: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 15,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
  },
  codeText: {
    marginRight: 10,
    fontSize: 16,
    paddingHorizontal: 10,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdownContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#00843D',
  },
  dropdownOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownCancelButton: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dropdownCancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'red',
  },
});

export default SignupDetails;