// src/navigation/RootNavigator.tsx
import React from 'react';
import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView, StatusBar, Platform } from 'react-native';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import FootScanScreen from '../screens/Home/FootScanScreen';
import SplashScreen from '../screens/SplashScreen';
import { getAuth } from '@react-native-firebase/auth';
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
import GoogleRetailer from '../screens/Home/GoogleRetailer';
import AdvertizeBusiness from '../screens/Home/AdvertizeBusiness';
const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { hasProfile, isLoggedIn, loading } = useUser();

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
            {
              (!hasProfile) ?
                (
                  <>
                    <Stack.Screen name="GoogleRetailer" component={GoogleRetailer} />
                  </>
                )
                :
                (
                  <>
                    <Stack.Screen name="MainTabs" component={AppTabs} />
                    <Stack.Screen name="FootScanScreen" component={FootScanScreen} />
                    <Stack.Screen name="InsoleQuestions" component={InsoleQuestions} />
                    <Stack.Screen name="InsoleRecommendation" component={InsoleRecommendation} />
                    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
                    <Stack.Screen name="Cart" component={CartScreen} />
                    <Stack.Screen name="ShoesSize" component={ShoesSize} />
                    <Stack.Screen name="OrthoticSale" component={OrthoticSale} />
                    <Stack.Screen name="Volumental" component={VolumentalScreen} />
                    <Stack.Screen name="Messaging" component={Messaging} />
                    <Stack.Screen name="AdvertizeBusiness" component={AdvertizeBusiness} />
                  </>
                )
            }
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
