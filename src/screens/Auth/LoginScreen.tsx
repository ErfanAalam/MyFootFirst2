import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Platform
} from 'react-native';
import { getAuth, GoogleAuthProvider, OAuthProvider } from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import CustomAlertModal from '../../Components/CustomAlertModal';
import appleAuth, { AppleRequestOperation, AppleRequestScope } from '@invertase/react-native-apple-authentication';

// Define navigation types
type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  MainTabs: undefined;
  Home: undefined;
  EmployeLogin: undefined;
};

const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const checkRetailerEmail = async (email: string) => {
    try {
      const retailersRef = firestore().collection('Retailers');
      const querySnapshot = await retailersRef.where('email', '==', email).get();
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking retailer email:', error);
      return false;
    }
  };

  const handleLogin = async () => {
    try {
      // First check if email exists in Retailers collection
      const isRetailer = await checkRetailerEmail(email);

      if (!isRetailer) {
        showAlert('Error', 'No retailer account found with this email', 'error');
        return;
      }

      // Proceed with login if email exists
      await getAuth().signInWithEmailAndPassword(email, password);
      showAlert('Success', 'User logged in successfully', 'success');
      navigation.navigate('MainTabs');
    } catch (error) {
      showAlert('Error', (error as Error).message, 'error');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices();

      // Get the user's tokens
      await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(tokens.accessToken);

      // Sign in with the credential
      const userCredential = await getAuth().signInWithCredential(googleCredential);

      // Check if the user's email exists in Retailers collection
      const isRetailer = await checkRetailerEmail(userCredential.user.email || '');

      if (!isRetailer) {
        // Sign out if not a retailer
        await getAuth().signOut();
        showAlert('Error', 'No retailer account found with this email', 'error');
        return;
      }

      showAlert('Success', 'Successfully signed in with Google', 'success');
      navigation.navigate('MainTabs');
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        showAlert('Error', 'Sign in was cancelled', 'error');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        showAlert('Error', 'Sign in is already in progress', 'error');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showAlert('Error', 'Play services not available', 'error');
      } else {
        showAlert('Error', error.message || 'An unknown error occurred', 'error');
      }
    }
  };

  const handleAppleSignIn = async () => {
    try {
      // Start the sign-in request
      const appleAuthResponse = await appleAuth.performRequest({
        requestedOperation: AppleRequestOperation.LOGIN,
        requestedScopes: [AppleRequestScope.EMAIL, AppleRequestScope.FULL_NAME],
      });

      // Ensure Apple returned a user identityToken
      if (!appleAuthResponse.identityToken) {
        throw new Error('Apple Sign-In failed - no identify token returned');
      }

      // Create a Firebase credential from the response
      const { identityToken, nonce } = appleAuthResponse;
      const appleCredential = OAuthProvider.credential('apple.com', identityToken, nonce);

      // Sign in with the credential
      const userCredential = await getAuth().signInWithCredential(appleCredential);

      // Check if the user's email exists in Retailers collection
      const isRetailer = await checkRetailerEmail(userCredential.user.email || '');

      if (!isRetailer) {
        // Sign out if not a retailer
        await getAuth().signOut();
        showAlert('Error', 'No retailer account found with this email', 'error');
        return;
      }

      showAlert('Success', 'Successfully signed in with Apple', 'success');
      navigation.navigate('MainTabs');
    } catch (error: any) {
      if (error.code === appleAuth.Error.CANCELED) {
        showAlert('Error', 'Sign in was cancelled', 'error');
      } else {
        showAlert('Error', error.message || 'An unknown error occurred', 'error');
        console.error(error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlertModal
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
      />
      <View style={styles.formContainer}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder=""
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder=""
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotPasswordContainer}>
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignIn}>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
            style={styles.socialIcon}
          />
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity style={styles.socialButton} onPress={handleAppleSignIn}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/0/747.png' }}
              style={styles.socialIcon}
            />
            <Text style={styles.socialButtonText}>Continue with Apple</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          We will never post anything without your permission.
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 18,
    color: '#000000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholderView: {
    width: 30,
  },
  formContainer: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 12,
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
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#757575',
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#757575',
    fontSize: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 14,
    color: '#212121',
  },
  footer: {
    position: 'relative',
    bottom: -200,
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: 16,
    zIndex: 0,
  },
  footerText: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});

export default LoginScreen;