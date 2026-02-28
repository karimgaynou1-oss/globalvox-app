import React, { useState, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type {
  WebViewNavigation,
  WebViewNavigationEvent,
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
  WebViewMessageEvent,
} from 'react-native-webview/lib/WebViewTypes';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../navigation/types';
import Config from '../../core/config';
import Logger from '../../core/logger';
import ControlCenter from './ControlCenter';
import { WebViewStatus } from './types';
import { VIDEO_DETECTOR_JS, VideoDetectionPayload } from './videoDetection';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const [webViewStatus, setWebViewStatus] = useState<WebViewStatus>('Loading');
  const [controlCenterVisible, setControlCenterVisible] = useState(false);
  const [detectedVideoCount, setDetectedVideoCount] = useState(0);

  // ── WebView telemetry ──────────────────────────────────────────────────────

  const handleLoadStart = useCallback((_event: WebViewNavigationEvent): void => {
    Logger.info('WebView onLoadStart');
    setWebViewStatus('Loading');
    setDetectedVideoCount(0);
  }, []);

  const handleLoadEnd = useCallback((_event: WebViewNavigationEvent | WebViewErrorEvent): void => {
    Logger.info('WebView onLoadEnd');
    setWebViewStatus('Ready');
  }, []);

  const handleWebViewError = useCallback((event: WebViewErrorEvent): void => {
    Logger.warn('WebView onError', { description: event.nativeEvent.description });
    setWebViewStatus('Error');
  }, []);

  const handleHttpError = useCallback((event: WebViewHttpErrorEvent): void => {
    Logger.warn('WebView onHttpError', { statusCode: event.nativeEvent.statusCode });
    setWebViewStatus('Error');
  }, []);

  const handleNavigationStateChange = useCallback((state: WebViewNavigation): void => {
    Logger.debug('WebView onNavigationStateChange', {
      url: state.url,
      loading: state.loading,
      canGoBack: state.canGoBack,
    });
  }, []);

  // ── Video detection bridge (Phase-2 scaffold) ──────────────────────────────

  const handleMessage = useCallback((event: WebViewMessageEvent): void => {
    try {
      const parsed: unknown = JSON.parse(event.nativeEvent.data);
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        (parsed as Record<string, unknown>).type === 'VIDEO_DETECTED' &&
        typeof (parsed as Record<string, unknown>).count === 'number'
      ) {
        const payload = parsed as VideoDetectionPayload;
        Logger.debug('Video detection bridge', { count: payload.count });
        setDetectedVideoCount(payload.count);
      }
    } catch {
      // Malformed message from injected JS — ignore.
    }
  }, []);

  // ── UI handlers ────────────────────────────────────────────────────────────

  const handleOpenControlCenter = useCallback((): void => {
    Logger.info('Opening Control Center');
    setControlCenterVisible(true);
  }, []);

  const handleCloseControlCenter = useCallback((): void => {
    Logger.info('Closing Control Center');
    setControlCenterVisible(false);
  }, []);

  const handleNavigateToSubscription = useCallback((): void => {
    Logger.info('Navigating to Subscription screen');
    navigation.navigate('Subscription');
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Top safe-area header — prevents content from sliding under the iOS notch */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>{Config.APP_NAME}</Text>
      </View>

      <WebView
        source={{ uri: Config.INSTAGRAM_URL }}
        style={styles.webview}
        injectedJavaScript={VIDEO_DETECTOR_JS}
        onMessage={handleMessage}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleWebViewError}
        onHttpError={handleHttpError}
        onNavigationStateChange={handleNavigationStateChange}
      />

      {/* Floating Action Button — always rendered above the WebView */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpenControlCenter}
        activeOpacity={0.8}
        accessibilityLabel="Open GlobalVox Control Center"
        accessibilityRole="button"
      >
        <Text style={styles.fabLabel}>{Config.APP_NAME}</Text>
      </TouchableOpacity>

      <ControlCenter
        visible={controlCenterVisible}
        webViewStatus={webViewStatus}
        detectedVideoCount={detectedVideoCount}
        onNavigateToSubscription={handleNavigateToSubscription}
        onClose={handleCloseControlCenter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6600',
    letterSpacing: 0.5,
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

