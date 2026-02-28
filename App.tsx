import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppErrorBoundary from './src/core/error-boundary/AppErrorBoundary';
import RootNavigator from './src/navigation/RootNavigator';

/**
 * Composition root.
 * Responsibilities are intentionally limited to:
 *   1. Mounting the error boundary so all render errors are captured.
 *   2. Providing the safe-area context required by useSafeAreaInsets.
 *   3. Providing the navigation container context.
 *   4. Delegating screen routing to RootNavigator.
 */
export default function App(): React.JSX.Element {
  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}
