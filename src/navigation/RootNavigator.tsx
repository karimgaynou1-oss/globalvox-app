import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import HomeScreen from '../features/home/HomeScreen';
import SubscriptionScreen from '../features/subscription/SubscriptionScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root stack navigator.
 * All screen registrations live here; App.tsx remains a thin composition root.
 */
export default function RootNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
    </Stack.Navigator>
  );
}
