import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { getAuth } from '@react-native-firebase/auth';

import { useUser } from '../../contexts/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define navigation types
type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  MainTabs: undefined;
  Home: undefined;
  Cart: undefined;
  Messaging: undefined;
  OrderHistory: undefined;
  ReferralCode: undefined;
  EmployeeLogin: undefined;
};

const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const user = getAuth().currentUser;
  const { userData, setIsLoggedIn, setUserData } = useUser();

  const handleNavigation = (screen: keyof RootStackParamList) => {
    navigation.navigate(screen);
  };

  const onLogout = async () => {

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        // Firebase Auth user
        await auth.signOut();
        setUserData(null);
        console.log('Firebase user signed out successfully');
      } else {
        // Employee user via AsyncStorage
        await AsyncStorage.removeItem('loggedInEmployee');
        await AsyncStorage.setItem('isEmployeeLoggedIn', 'false');
        await AsyncStorage.removeItem('Retailerid');
        setIsLoggedIn(false);
        setUserData(null);
        console.log('Employee logged out successfully');
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{userData?.businessName ? `${userData.businessName}` : `${userData?.name}` ? `${userData?.name}` : "User"}</Text>
            <Text style={styles.emailText}>{user ? user?.email : userData?.email}</Text>
          </View>

          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
            onPress={() => handleNavigation('AdvertizeBusiness')}
            >
              <Text style={styles.menuItemText}>Advertise Your Business</Text>
            </TouchableOpacity>




            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigation('Messaging')}
            >
              <Text style={styles.menuItemText}>Messaging</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigation('OrderHistory')}
            >
              <Text style={styles.menuItemText}>My Foot First Subscription Managment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigation('OrderHistory')}
            >
              <Text style={styles.menuItemText}>Retiler ID : {userData?.RetailerId}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={onLogout}
            >
              <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingBottom: 30,
  },
  header: {
    marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 10,
    color: '#000',
  },
  emailText: {
    fontSize: 16,
    color: '#666',
  },
  menuContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  logoutItem: {
    borderBottomWidth: 0,
    backgroundColor: '#fff',
  },
  logoutText: {
    color: '#FF3B30',
    fontWeight: '500',
  },
});

export default ProfileScreen;
