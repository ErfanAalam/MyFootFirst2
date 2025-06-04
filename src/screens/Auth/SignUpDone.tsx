import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import CustomAlertModal from '../../Components/CustomAlertModal';

const SignUpDone = ({ route }: { route: any }) => {
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
    password,
    address,
    city,
    state,
    postalCode,
    countryCode,
    callingCode,
    country,
    phone,
  } = route.params;

  const [monthlyVolume, setMonthlyVolume] = useState('');
  const [sellsOrthotics, setSellsOrthotics] = useState('');
  const [showOrthopticsDropdown, setShowOrthopticsDropdown] = useState(false);

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!businessName || !businessType || !contactFirstName || !contactLastName || !contactRole || !email || !password || !address || !city || !state || !postalCode || !country || !monthlyVolume || !sellsOrthotics) {
      showAlert("Validation Error", "All required fields must be filled.", 'error');
      return false;
    }
    if (!emailRegex.test(email)) {
      showAlert("Invalid Email", "Please enter a valid email address.", 'error');
      return false;
    }
    if (password.length < 6) {
      showAlert("Weak Password", "Password must be at least 6 characters.", 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const RetailerId = businessName.toLowerCase();

      // Create user authentication account
      const userCredential = await getAuth().createUserWithEmailAndPassword(email, password);

      const db = getFirestore();
      // Create retailer profile in Firestore
      await db.collection('Retailers')
        .doc(RetailerId)
        .set({
          uid: userCredential.user.uid,
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
          phone,
          callingCode,
          monthlyVolume,
          sellsOrthotics,
          RetailerId,
          createdAt:new Date(),
        });

      showAlert(
        "Registration Successful",
        "Your business account has been created successfully!",
        'success'
      );

      // TODO: Add navigation after successful registration
      // navigation.navigate('NextScreen');

    } catch (error) {
      showAlert("Registration Failed", (error as Error).message, 'error');
    }
  };

  // Handle orthoptics selection
  const handleOrthopticsSelect = (selection: string) => {
    setSellsOrthotics(selection);
    setShowOrthopticsDropdown(false);
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
        <Text style={styles.title}>Business Information</Text>

        <TextInput
          placeholder="Average Monthly Footfall/Patient Volume*"
          placeholderTextColor="#999"
          style={styles.input}
          keyboardType="numeric"
          value={monthlyVolume}
          onChangeText={setMonthlyVolume}
        />

        {/* Sell Orthotics Dropdown */}
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowOrthopticsDropdown(true)}
        >
          <Text style={sellsOrthotics ? styles.inputText : styles.placeholderText}>
            {sellsOrthotics ? `Currently Sell Orthotics: ${sellsOrthotics}` : 'Do You Currently Sell Orthotics?*'}
          </Text>
        </TouchableOpacity>

        {/* Sell Orthotics Modal */}
        <Modal
          visible={showOrthopticsDropdown}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowOrthopticsDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowOrthopticsDropdown(false)}
          >
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownTitle}>Do You Currently Sell Orthotics?</Text>
              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => handleOrthopticsSelect('Yes')}
              >
                <Text style={styles.dropdownOptionText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => handleOrthopticsSelect('No')}
              >
                <Text style={styles.dropdownOptionText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownCancelButton}
                onPress={() => setShowOrthopticsDropdown(false)}
              >
                <Text style={styles.dropdownCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

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

export default SignUpDone;