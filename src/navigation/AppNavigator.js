import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

// Auth Screens
import OnboardingScreen from '../screens/Auth/OnboardingScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import HomeLoading from '../screens/Main/HomeLoading';

// Main Screens (하단바에서 이동할 모든 페이지를 import)
import MainHome from '../screens/Main/MainHome';
import ExploreScreen from '../screens/Main/ExploreScreen';
import MatchesScreen from '../screens/Main/MatchesScreen';

// Chat & Profile Screens
import ChatListScreen from '../screens/Chat/ChatListScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import MyProfileScreen from '../screens/Profile/MyProfile';

// Map Screen
import MapScreen from '../screens/Map/MapScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#ffffff' } 
        }}
      >
        {/* Auth Flow */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="HomeLoading" component={HomeLoading} />
        {/* Main Pages (하단 바가 포함된 모든 페이지) */}
        <Stack.Screen name="MainHome" component={MainHome} />
        <Stack.Screen name="Explore" component={ExploreScreen} />
        <Stack.Screen name="Map" component={MapScreen} /> 
        <Stack.Screen name="Matches" component={MatchesScreen} />
        <Stack.Screen name="ChatList" component={ChatListScreen} />
        <Stack.Screen name="MyProfile" component={MyProfileScreen} />
        
        {/* 상세 화면 */}
        <Stack.Screen name="Chat" component={ChatScreen} /> 
      </Stack.Navigator>
    </NavigationContainer>
  );
}