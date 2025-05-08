// src/navigation/AppTabs.tsx
import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView, StatusBar, Platform, View, Text, StyleSheet } from 'react-native';
import HomeScreen from '../screens/Home/HomeScreen';
import ProfileScreen from '../screens/Home/ProfileScreen';
import EducationScreen from '../screens/Home/EducationScreen';  // Add your Education screen here
// import EcommerceScreen from '../screens/Home/EcommerceScreen';  // Add your Ecommerce screen here
import Dashboard from '../screens/Home/Dashboard';
import { AppTabsParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Tab = createBottomTabNavigator<AppTabsParamList>();


const AppTabs = () => {
  const [isEmployee, setIsEmployee] = useState<boolean | null>(null);

  useEffect(() => {
    const checkEmployeeStatus = async () => {
      const value = await AsyncStorage.getItem('isEmployeeLoggedIn');
      setIsEmployee(value === 'true');
    };
    checkEmployeeStatus();
  }, []);

  // Optionally show a loading screen while checking
  if (isEmployee === null) {
    return null;
  }
  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor="#ffffff" barStyle="light-content" />
      <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          color: '#000000',
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: "#00843D",
          paddingTop: 6,
          height: 60,
          paddingBottom: 8,
          borderTopWidth: 0,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: string = 'home'; // Default icon

          // Set icon based on the route name
          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Profile') {
            iconName = 'user-alt';
          } else if (route.name === 'Education') {
            iconName = 'book';  // You can choose any icon you like for Education
          } else if (route.name === 'Dashboard') {
            iconName = 'chart-line'
          }
          // Change icon color based on focused state
          const iconColor = focused ? 'black' : 'white';

          return (
            <View style={styles.iconContainer}>
              <Icon 
                name={iconName} 
                size={size} 
                color={iconColor} 
              />
              {/* {focused && <View style={styles.activeIndicator} />} */}
            </View>
          );
        },
        tabBarLabel: ({ focused, color }) => {
          let label = '';
          
          if (route.name === 'Home') {
            label = 'Home';
          } else if (route.name === 'Profile') {
            label = 'Profile';
          } else if (route.name === 'Education') {
            label = 'Education';
          } else if (route.name === 'Dashboard') {
            label = 'Dashboard';
          }
          
          return (
            <Text 
              style={[
                styles.tabLabel, 
                { color: focused ? "black" : "white" }
              ]}
            >
              {label}
            </Text>
          );
        },
        tabBarActiveTintColor: 'black',
        tabBarInactiveTintColor: 'white',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Education" component={EducationScreen} />
      {!isEmployee && <Tab.Screen name="Dashboard" component={Dashboard} />}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  </SafeAreaProvider>
  );
};


const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
    marginTop: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});

export default AppTabs;
