import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions
} from 'react-native';
// import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
// import { getAuth, createUserWithEmailAndPassword } from '@react-native-firebase/auth';

const { width } = Dimensions.get('window');

const SignupScreen = () => {
  const navigation = useNavigation();

  // useEffect(() => {
  //   GoogleSignin.configure({
  //     webClientId: '608411623919-0ggji53i05h7fnkbg5cj9qbo1ctf545m.apps.googleusercontent.com',
  //   });
  // })

  // const onGoogleButtonPress = async () => {
  //   try {
  //     // Ensure Google Play services are available (especially important on Android)
  //     await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  
  //     // Get the user's ID token
  //     const { idToken } = await GoogleSignin.signIn();
  
  //     // Create a Google credential with the token
  //     const googleCredential = getAuth().GoogleAuthProvider.credential(idToken);
  
  //     // Sign-in the user with the credential
  //     const userCredential = await getAuth().signInWithCredential(googleCredential);
  
  //     // Optional: Check if it's a new user or existing user
  //     const isNewUser = userCredential.additionalUserInfo?.isNewUser;
  
  //     // Navigate to SignupDetails (if it's a new user) or somewhere else
  //     if (isNewUser) {
  //       // navigation.navigate('SignupDetails');
  //     } else {
  //       // navigation.navigate('Home'); // or whatever your main screen is
  //     }
  //   } catch (error) {
  //     console.error('Google Sign-In Error:', error);
  //     // You can show an alert or toast here for UX
  //   }
  // };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>
          Welcome! Let's customize{'\n'}MyFirstFoot for your goals.
        </Text>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => navigation.navigate('SignupDetails')}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>OR</Text>

        <TouchableOpacity style={styles.socialButton} 
        // onPress={()=>onGoogleButtonPress()}
        >
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
            style={styles.socialIcon}
          />
          <Text style={styles.socialButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton}>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/0/747.png' }}
            style={styles.socialIcon}
          />
          <Text style={styles.socialButtonText}>Continue with Apple</Text>
        </TouchableOpacity>

        <Text style={styles.privacyText}>
          We will collect personal information from and about you and use it for
          various purposes, including to customize your MyFitnessPal experience.
          Read more about the purposes, our practices, your choices, and your
          rights in our <Text style={styles.link}>Privacy Policy</Text>.
        </Text>
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
    justifyContent: 'center',
    marginTop: 200,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '600',
    marginVertical: 20,
  },
  continueButton: {
    backgroundColor: '#00843D',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  continueText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  orText: {
    marginVertical: 20,
    fontSize: 14,
    color: '#999',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    width: '100%',
    borderColor: '#E0E0E0',
    borderRadius: 8,
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
  privacyText: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    marginTop: 30,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});

export default SignupScreen;