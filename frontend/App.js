import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import ModeSetupScreen from './src/screens/ModeSetupScreen';
import BlockPromptScreen from './src/screens/BlockPromptScreen';
import HighRiskOverlayScreen from './src/screens/HighRiskOverlayScreen';
import HighRiskPromptScreen from './src/screens/HighRiskPromptScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0a0a' },
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
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="HighRiskPrompt"
          component={HighRiskPromptScreen}
          options={{ gestureEnabled: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
