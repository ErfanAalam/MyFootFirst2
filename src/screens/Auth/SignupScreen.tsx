import React, { useState } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { getAuth, GoogleAuthProvider, OAuthProvider } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import CustomAlertModal from '../../Components/CustomAlertModal';
import appleAuth, { AppleRequestOperation, AppleRequestScope } from '@invertase/react-native-apple-authentication';


// Define navigation types
type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignupDetails: {
    email?: string;
    isGoogleSignIn?: boolean;
    isAppleSignIn?: boolean;
  };
  MainTabs: undefined;
  Home: undefined;
  EmployeLogin: undefined;
};

const SignupScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertModal({
      visible: true,
      title,
      message,
      type,
    });
  };

  const hideAlert = () => {
    setAlertModal(prev => ({ ...prev, visible: false }));
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      // Ensure Google Play services are available
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Get the user's tokens
      await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      // Create a Google credential with the tokens
      const googleCredential = GoogleAuthProvider.credential(tokens.idToken, tokens.accessToken);

      // Sign-in the user with the credential
      const userCredential = await getAuth().signInWithCredential(googleCredential);

      // Check if the user's email already exists in Retailers collection
      const retailersRef = firestore().collection('Retailers');
      const querySnapshot = await retailersRef.where('email', '==', userCredential.user.email).get();

      if (!querySnapshot.empty) {
        // If email exists, sign out and show error
        await getAuth().signOut();
        showAlert('Error', 'An account with this email already exists. Please login instead.', 'error');
        return;
      }

      // If email doesn't exist, proceed to signup details
      showAlert('Success', 'Successfully signed in with Google', 'success');
      if (userCredential.user.email) {
        navigation.navigate('SignupDetails', {
          email: userCredential.user.email,
          isGoogleSignIn: true,
        });
      } else {
        throw new Error('No email found in Google account');
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        showAlert('Error', 'Sign in was cancelled', 'error');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        showAlert('Error', 'Sign in is already in progress', 'error');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showAlert('Error', 'Play services not available', 'error');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        showAlert('Account Exists', 'An account already exists with this email using a different sign-in method.', 'error');
      } else if (error.code === 'auth/network-request-failed') {
        showAlert('Network Error', 'Please check your internet connection and try again.', 'error');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // User cancelled the sign-in flow
        return;
      } else {
        showAlert(
          'Sign-In Error',
          `Failed to sign in with Google. Error: ${error.message || 'Unknown error'}. Please try again.`,
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (Platform.OS !== 'ios') {
      showAlert('Not Available', 'Apple Sign-In is only available on iOS devices.', 'info');
      return;
    }

    try {
      setLoading(true);

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

      // Check if the user's email already exists in Retailers collection
      const retailersRef = firestore().collection('Retailers');
      const querySnapshot = await retailersRef.where('email', '==', userCredential.user.email).get();

      if (!querySnapshot.empty) {
        // If email exists, sign out and show error
        await getAuth().signOut();
        showAlert('Error', 'An account with this email already exists. Please login instead.', 'error');
        return;
      }

      // If email doesn't exist, proceed to signup details
      showAlert('Success', 'Successfully signed in with Apple', 'success');
      if (userCredential.user.email) {
        navigation.navigate('SignupDetails', {
          email: userCredential.user.email,
          isAppleSignIn: true,
        });
      } else {
        throw new Error('No email found in Apple account');
      }
    } catch (error: any) {
      if (error.code === appleAuth.Error.CANCELED) {
        showAlert('Error', 'Sign in was cancelled', 'error');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        showAlert('Account Exists', 'An account already exists with this email using a different sign-in method.', 'error');
      } else {
        showAlert('Sign-In Error', 'Failed to sign in with Apple. Please try again.', 'error');
        console.error('Apple Sign-In Error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>
          Welcome! Let's customize{'\n'}MyFirstFoot for your goals.
        </Text>

        <TouchableOpacity
          style={[styles.continueButton, loading && styles.disabledButton]}
          onPress={() => navigation.navigate('SignupDetails', {})}
          disabled={loading}
        >
          <Text style={styles.continueText}>
            {loading ? 'Please wait...' : 'Continue'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.orText}>OR</Text>

        <TouchableOpacity
          style={[styles.socialButton, loading && styles.disabledButton]}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
            style={styles.socialIcon}
          />
          <Text style={styles.socialButtonText}>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.socialButton, loading && styles.disabledButton]}
            onPress={handleAppleSignIn}
            disabled={loading}
          >
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/0/747.png' }}
              style={styles.socialIcon}
            />
            <Text style={styles.socialButtonText}>
              {loading ? 'Signing in...' : 'Continue with Apple'}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.privacyText}>
          We will collect personal information from and about you and use it for
          various purposes, including to customize your MyFitnessPal experience.
          Read more about the purposes, our practices, your choices, and your
          rights in our <Text style={styles.link}>Privacy Policy</Text>.
        </Text>
      </ScrollView>
      <CustomAlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  continueButton: {
    backgroundColor: '#00843D',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  continueText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  orText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '100%',
    marginBottom: 15,
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  socialButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  privacyText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default SignupScreen;
