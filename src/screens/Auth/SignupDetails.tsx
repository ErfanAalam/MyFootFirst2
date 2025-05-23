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
import CountryPicker from 'react-native-country-picker-modal';
import CustomAlertModal from '../../Components/CustomAlertModal';
import CheckBox from '@react-native-community/checkbox';

const SignupDetails = () => {
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

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const onSelectCountry = (country: any) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
    setCountry(country.name);
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!businessName || !businessType || !contactFirstName || !contactLastName || !contactRole || !email || !address || !city || !state || !postalCode || !country || !countryCode || !callingCode || !phone) {
      showAlert("Validation Error", "All required fields must be filled.", 'error');
      return false;
    }
    if (!emailRegex.test(email)) {
      showAlert("Invalid Email", "Please enter a valid email address.", 'error');
      return false;
    }
    if (!privacyAccepted) {
      showAlert("Privacy Policy", "Please accept the privacy policy to continue.", 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      navigation.navigate('SignUpPassword', {
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
      showAlert("Registration Failed", (error as Error).message, 'error');
    }
  };

  // Handle business type selection
  const handleBusinessTypeSelect = (selectedType: string) => {
    setBusinessType(selectedType);
    setShowBusinessTypeDropdown(false);
  };

  const PrivacyPolicyModal = () => (
    <Modal
      visible={showPrivacyModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPrivacyModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.privacyModalContent}>
          <ScrollView style={styles.privacyScrollView}>
            <Text style={styles.privacyTitle}>Privacy Policy</Text>
            <Text style={styles.privacySubtitle}>MyFootFirst</Text>
            <Text style={styles.privacyEffectiveDate}>Effective Date: 10 May 2025</Text>

            <Text style={styles.privacyIntro}>
              This Privacy Policy explains how MyFootFirst collects, uses, stores, and shares personal data when you use our mobile applications and services, whether as a business partner (B2B) or an individual customer (B2C), in accordance with the General Data Protection Regulation (GDPR) and other applicable laws.
            </Text>

            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>1. Data Controller</Text>
              <Text style={styles.privacyText}>
                MyFootFirst is the controller of your personal data. For any questions or requests, you may contact us at{' '}
                <Text style={styles.privacyEmail}>info@myfootfirst.com</Text>
              </Text>
            </View>

            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>2. What We Collect</Text>
              <Text style={styles.privacyText}>
                We may collect and process the following categories of personal data:
              </Text>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBulletTitle}>Identity and Contact Data:</Text>
                <Text style={styles.privacyText}>Name, email, business details, and phone number.</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBulletTitle}>Health-Related Information:</Text>
                <Text style={styles.privacyText}>Self-declared conditions such as diabetes or hypertension (used to personalize product recommendations).</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBulletTitle}>Biometric Data:</Text>
                <Text style={styles.privacyText}>Foot images and measurements for orthotic creation, potentially used for generating anonymized, proprietary 3D models.</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBulletTitle}>Transaction Data:</Text>
                <Text style={styles.privacyText}>Purchase and payment information via providers like Stripe.</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBulletTitle}>Technical Data:</Text>
                <Text style={styles.privacyText}>Device ID, app usage, crash logs, and location (if permission granted).</Text>
              </View>
            </View>

            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>3. How We Use Your Data</Text>
              <Text style={styles.privacyText}>We use your data to:</Text>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBullet}>•</Text>
                <Text style={styles.privacyText}>Provide and improve our services</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBullet}>•</Text>
                <Text style={styles.privacyText}>Customize your experience</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBullet}>•</Text>
                <Text style={styles.privacyText}>Create and deliver orthotic products</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBullet}>•</Text>
                <Text style={styles.privacyText}>Fulfill legal and contractual obligations</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBullet}>•</Text>
                <Text style={styles.privacyText}>Conduct anonymized product development and analytics</Text>
              </View>
              <Text style={[styles.privacyText, styles.privacyNote]}>
                All processing is based on one or more lawful bases under GDPR: consent, performance of a contract, legal obligation, or legitimate interest.
              </Text>
            </View>

            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>4. Data Retention</Text>
              <Text style={styles.privacyText}>
                We retain personal data for as long as necessary to fulfill the purposes outlined above, including up to 1 year for biometric data. Anonymized data may be retained longer for R&D purposes.
              </Text>
            </View>

            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>5. Sharing and Third Parties</Text>
              <Text style={styles.privacyText}>
                We use third-party services (e.g., Stripe, AWS, Firebase) for storage, payment processing, and analytics. These services are independently responsible for GDPR compliance. We do not sell your personal data.
              </Text>
            </View>

            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>6. Your Rights (Under GDPR)</Text>
              <Text style={styles.privacyText}>You have the right to:</Text>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBullet}>•</Text>
                <Text style={styles.privacyText}>Access your data</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBullet}>•</Text>
                <Text style={styles.privacyText}>Correct or delete your data</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBullet}>•</Text>
                <Text style={styles.privacyText}>Restrict or object to processing</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBullet}>•</Text>
                <Text style={styles.privacyText}>Data portability</Text>
              </View>
              <View style={styles.privacyBulletPoint}>
                <Text style={styles.privacyBullet}>•</Text>
                <Text style={styles.privacyText}>Withdraw consent at any time</Text>
              </View>
              <Text style={[styles.privacyText, styles.privacyNote]}>
                Requests can be sent to{' '}
                <Text style={styles.privacyEmail}>info@myfootfirst.com</Text>
                . We will respond within 30 days.
              </Text>
            </View>

            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>7. Security</Text>
              <Text style={styles.privacyText}>
                We take reasonable technical and organizational measures to protect your data, but we cannot guarantee security of third-party platforms or user-managed access.
              </Text>
            </View>

            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>8. Responsibilities of Business Users</Text>
              <Text style={styles.privacyText}>
                Retailers and other business users are responsible for ensuring their use of the platform and any employee or customer data they input complies with applicable data protection laws.
              </Text>
            </View>
          </ScrollView>
          <TouchableOpacity
            style={styles.closePrivacyButton}
            onPress={() => setShowPrivacyModal(false)}
          >
            <Text style={styles.closePrivacyButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <CustomAlertModal
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
      />
      <PrivacyPolicyModal />
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

        <View style={styles.privacyCheckboxContainer}>
          <CheckBox
            value={privacyAccepted}
            onValueChange={setPrivacyAccepted}
            style={styles.checkbox}
            tintColors={{ true: '#007AFF', false: '#999' }}
          />
          <Text style={styles.privacyCheckboxText}>
            I have read and agree to the{' '}
            <Text
              style={styles.privacyLink}
              onPress={() => setShowPrivacyModal(true)}
            >
              Privacy Policy
            </Text>
          </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
  privacyCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  checkbox: {
    marginRight: 10,
  },
  privacyCheckboxText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  privacyLink: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  privacyModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  privacyScrollView: {
    maxHeight: '90%',
  },
  privacyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  privacySubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 5,
    color: '#666',
  },
  privacyEffectiveDate: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#999',
  },
  privacyIntro: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    color: '#333',
  },
  privacySection: {
    marginBottom: 20,
  },
  privacySectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 5,
  },
  privacyBulletPoint: {
    flexDirection: 'row',
    marginBottom: 5,
    paddingLeft: 10,
  },
  privacyBullet: {
    marginRight: 5,
    color: '#333',
  },
  privacyBulletTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  privacyNote: {
    fontStyle: 'italic',
    marginTop: 10,
  },
  privacyEmail: {
    color: '#00843D',
    textDecorationLine: 'underline',
  },
  closePrivacyButton: {
    backgroundColor: '#00843D',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  closePrivacyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignupDetails;