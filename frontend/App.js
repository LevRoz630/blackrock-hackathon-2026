import React from 'react';
import { Platform, View, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import HomeScreen from './src/screens/HomeScreen';
import ModeSetupScreen from './src/screens/ModeSetupScreen';
import BlockPromptScreen from './src/screens/BlockPromptScreen';
import HighRiskOverlayScreen from './src/screens/HighRiskOverlayScreen';
import HighRiskPromptScreen from './src/screens/HighRiskPromptScreen';
import DashboardScreen from './src/screens/DashboardScreen';

const Stack = createNativeStackNavigator();

function AppContent() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#050506' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ModeSetup" component={ModeSetupScreen} />
        <Stack.Screen
          name="BlockPrompt"
          component={BlockPromptScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="HighRiskOverlay"
          component={HighRiskOverlayScreen}
          options={{ presentation: 'transparentModal', animation: 'fade' }}
        />
        <Stack.Screen
          name="HighRiskPrompt"
          component={HighRiskPromptScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) return null;

  if (Platform.OS === 'web') {
    return (
      <View style={web.outer}>
        <View style={web.phone}>
          <View style={web.notch} />
          <View style={web.screen}>
            <AppContent />
          </View>
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#050506" />
      <AppContent />
    </>
  );
}

const web = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phone: {
    width: 390,
    height: 844,
    backgroundColor: '#050506',
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#333',
    overflow: 'hidden',
    position: 'relative',
  },
  notch: {
    width: 160,
    height: 28,
    backgroundColor: '#333',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    alignSelf: 'center',
    zIndex: 10,
  },
  screen: {
    flex: 1,
  },
});
