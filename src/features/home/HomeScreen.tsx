import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewErrorEvent, WebViewHttpErrorEvent } from 'react-native-webview/lib/WebViewTypes';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import Config from '../../core/config';
import Logger from '../../core/logger';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleWebViewError = useCallback((event: WebViewErrorEvent): void => {
    Logger.warn('WebView load error', { description: event.nativeEvent.description });
  }, []);

  const handleHttpError = useCallback((event: WebViewHttpErrorEvent): void => {
    Logger.warn('WebView HTTP error', { statusCode: event.nativeEvent.statusCode });
  }, []);

  const handleOpenSubscription = useCallback((): void => {
    Logger.info('Navigating to Subscription screen');
    navigation.navigate('Subscription');
  }, [navigation]);

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: Config.INSTAGRAM_URL }}
        style={styles.webview}
        onError={handleWebViewError}
        onHttpError={handleHttpError}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpenSubscription}
        activeOpacity={0.8}
        accessibilityLabel={Config.APP_NAME}
        accessibilityRole="button"
      >
        <Text style={styles.fabLabel}>{Config.APP_NAME}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: '#FF6600',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
