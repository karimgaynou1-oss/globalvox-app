import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AppErrorBoundary from './src/core/error-boundary/AppErrorBoundary';
import RootNavigator from './src/navigation/RootNavigator';

/**
 * Composition root.
 * Responsibilities are intentionally limited to:
 *   1. Mounting the error boundary so all render errors are captured.
 *   2. Providing the navigation container context.
 *   3. Delegating screen routing to RootNavigator.
 */
export default function App(): React.JSX.Element {
  return (
    <AppErrorBoundary>
      <NavigationContainer>
        <StatusBar style="auto" />
        <RootNavigator />
      </NavigationContainer>
    </AppErrorBoundary>
  );
}
