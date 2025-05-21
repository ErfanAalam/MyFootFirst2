// src/navigation/RootNavigator.tsx
import React from 'react';
import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView, StatusBar, Platform } from 'react-native';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import FootScanScreen from '../screens/Home/FootScanScreen';
import SplashScreen from '../screens/SplashScreen';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InsoleQuestions from '../screens/Home/InsoleQuestions';
import InsoleRecommendation from '../screens/Home/InsoleRecommendation';
import ProductDetailScreen from '../screens/Home/ProductDetailScreen';
import CartScreen from '../screens/Home/CartScreen';
import ShoesSize from '../screens/Home/ShoesSize';
import { useUser } from '../contexts/UserContext';
import OrthoticSale from '../screens/Home/OrthoticSale';
import VolumentalScreen from '../Volumental/VolumentalScreen';
import Messaging from '../screens/Home/Messaging';
const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isLoggedIn, loading } = useUser();

  // useEffect(() => {
  //   const auth = getAuth();
  
  //   const checkLoginState = async () => {
  //     try {
  //       const isEmployeeLoggedIn = await AsyncStorage.getItem('isEmployeeLoggedIn');
  
  //       if (isEmployeeLoggedIn === 'true') {
  //         setIsLoggedIn(true);
  //         setIsLoading(false);
  //       } else {
  //         // Wait for Firebase auth state
  //         const unsubscribe = onAuthStateChanged(auth, user => {
  //           if (user) {
  //             setIsLoggedIn(true);
  //           } else {
  //             setIsLoggedIn(false);
  //           }
  //           setIsLoading(false);
  //         });
  
  //         return unsubscribe;
  //       }
  //     } catch (error) {
  //       console.error('Error checking login state:', error);
  //       setIsLoading(false);
  //     }
  //   };
  
  //   checkLoginState();
  // }, []);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar backgroundColor="#ffffff" barStyle="light-content" />
      <NavigationContainer>
        {isLoggedIn ? (
          <Stack.Navigator screenOptions={{
            headerShown: false,
            headerStyle: {
              backgroundColor: '#ffffff',
            },
            headerShadowVisible: false,
          }}>
            <Stack.Screen name="MainTabs" component={AppTabs} />
            <Stack.Screen name="FootScanScreen" component={FootScanScreen} />
            <Stack.Screen name="InsoleQuestions" component={InsoleQuestions}/>
            <Stack.Screen name="InsoleRecommendation" component={InsoleRecommendation}/>
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen}/>
            <Stack.Screen name="Cart" component={CartScreen}/>
            <Stack.Screen name="ShoesSize" component={ShoesSize}/>
            <Stack.Screen name="OrthoticSale" component={OrthoticSale}/>
            <Stack.Screen name="Volumental" component={VolumentalScreen}/>
            <Stack.Screen name="Messaging" component={Messaging}/>
          </Stack.Navigator>
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
    </SafeAreaView>
  );
};

export default RootNavigator;

// 608411623919-0ggji53i05h7fnkbg5cj9qbo1ctf545m.apps.googleusercontent.com
