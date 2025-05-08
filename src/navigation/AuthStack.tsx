// src/navigation/AuthStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView, StatusBar, Platform } from 'react-native';
import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import SignupDetails from '../screens/Auth/SignupDetails';
import EmployeLoginScreen from '../screens/Auth/EmployeLoginScreen';
import { AuthStackParamList } from '../types/navigation';
import EmployeeEmail from '../screens/Auth/EmployeeEmail';
import EmployeePassword from '../screens/Auth/EmployeePassword';
import SignUpDone from '../screens/Auth/SignUpDone';
import SignUpPassword from '../screens/Auth/SignUpPassword';
const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => (
  <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
    <StatusBar backgroundColor="#ffffff" barStyle="light-content" />
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: true,
        headerTitleStyle: { color: 'black' }, 
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{headerShown:false}} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="SignupDetails" component={SignupDetails} />
      <Stack.Screen name="SignUpPassword" component={SignUpPassword} />
      <Stack.Screen name="SignUpDone" component={SignUpDone} />
      <Stack.Screen name="EmployeeLogin" component={EmployeLoginScreen} options={{ headerTitle:"VERIFY ID"}} />
      <Stack.Screen name="EmployeeEmail" component={EmployeeEmail} options={{ headerTitle:"Verify Email"}} />
      <Stack.Screen name="EmployeePassword" component={EmployeePassword} options={{ headerTitle:"Verify Password"}} />
    </Stack.Navigator>
  </SafeAreaView>
);

export default AuthStack;