import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// No need to manually initialize Firebase like on web
// Configuration is handled in native files (Android/iOS)


export { getAuth, firestore as db };
