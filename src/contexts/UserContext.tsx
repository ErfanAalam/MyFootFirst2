import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  query,
  where,
  collection,
} from '@react-native-firebase/firestore';
import {
  getAuth,
  onAuthStateChanged,
} from '@react-native-firebase/auth';
import { onSnapshot } from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserData {
  id: string;
  address: string;
  businessName: string;
  businessType: string;
  callingCode: string;
  city: string;
  contactFirstName: String,
  contactLastName: string;
  contactRole: string;
  country: string;
  countryCode: string;
  email: string;
  monthlyVolume: string;
  phone: string;
  postalCode: string;
  sellsOrthotics: string;
  state: string;
  uid: string;
  RetailerId: String,
}

interface UserContextType {
  user: null;
  userData: UserData | null;
  loading: boolean;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  saveInsoleAnswers: (answers: Record<string, any>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean>(true);
  const [retailerId, setRetailerId] = useState('');

  useEffect(() => {
    const auth = getAuth();

    const checkLoginState = async () => {
      try {
        const isEmployeeLoggedIn = await AsyncStorage.getItem('isEmployeeLoggedIn');
        const EmployeeData = await AsyncStorage.getItem('employeeData');

        if (isEmployeeLoggedIn === 'true') {
          setIsLoggedIn(true);
          setLoading(false);
          setUserData(JSON.parse(EmployeeData || '{}'));
        } else {
          // Wait for Firebase auth state
          const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
              setUser(user);
              setIsLoggedIn(true);
              setLoading(false);
            } else {
              setIsLoggedIn(false);
              setLoading(false);
            }
          });

          let timer = setTimeout(() => {
            setLoading(false);
          }, 1000);

          return () => { clearTimeout(timer); unsubscribe(); };
        }
      } catch (error) {
        console.error('Error checking login state:', error);
        setLoading(false);
      }
    };

    checkLoginState();
  }, []);


  useEffect(() => {
    if (userData?.RetailerId) {
      setRetailerId(userData?.RetailerId);
    } else {
      const RetailerId = AsyncStorage.getItem('Retailerid');
      setRetailerId(RetailerId);
    }
  }, [userData?.RetailerId]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    // console.log(isLoggedIn);
    if (isLoggedIn) {
      // Wait 5 seconds after login before checking profile
      timeoutId = setTimeout(async () => {
        try {
          const auth = getAuth();
          const user = auth.currentUser;

          if (user) {
            // Check the provider ID to determine login method
            const providerData = user.providerData[0];
            const isSocialAuth = providerData?.providerId === 'google.com' ||
              providerData?.providerId === 'apple.com';

            // Set hasProfile to false for social auth, true for email/password

            if(userData?.RetailerId){
              setHasProfile(!isSocialAuth);
            }
          }
        } catch (error) {
          console.error('Error checking user profile:', error);
          setHasProfile(false);
        }
      }, 5000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoggedIn]);



  useEffect(() => {
    console.log(user)
    if (!user) return;

    const app = getApp();
    const firestore = getFirestore(app);
    // const userDocRef = doc(firestore, 'Retailers', user?.uid);

    const q = query(
      collection(firestore, 'Retailers'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      // if (docSnapshot.exists) {
      //   const data = docSnapshot.data();
      if (!querySnapshot.empty) {
        const docSnapshot = querySnapshot.docs[0]; // Assuming only one retailer per UID
        const data = docSnapshot.data();

        setUserData({
          id: user?.uid,
          address: data?.address || '',
          businessName: data?.businessName || '',
          businessType: data?.businessType || '',
          callingCode: data?.callingCode || '',
          city: data?.city || '',
          contactFirstName: data?.contactFirstName || '',
          contactLastName: data?.contactLastName || '',
          contactRole: data?.contactRole || '',
          country: data?.country || '',
          countryCode: data?.countryCode || '',
          email: data?.email || '',
          monthlyVolume: data?.monthlyVolume || '',
          phone: data?.phone || '',
          postalCode: data?.postalCode || '',
          sellsOrthotics: data?.sellsOrthotics || '',
          state: data?.state || '',
          uid: data?.uid || '',
          RetailerId: data?.RetailerId || '',
          ...data, // includes any extra fields like employees
        });
      }
    });

    return () => unsubscribe(); // clean up listener when user or component unmounts
  }, [user]);



  const value = {
    user,
    userData,
    loading,
    isLoggedIn,
    setIsLoggedIn,
    setUserData,
    hasProfile,
    setHasProfile,
    retailerId
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

