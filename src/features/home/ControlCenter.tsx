import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { WebViewStatus, SupportedLanguage } from './types';
import Config from '../../core/config';
import Logger from '../../core/logger';

interface Props {
  visible: boolean;
  webViewStatus: WebViewStatus;
  onNavigateToSubscription: () => void;
  onClose: () => void;
}

/** Maps WebViewStatus to a display colour for the status indicator dot. */
const STATUS_COLOR: Record<WebViewStatus, string> = {
  Ready: '#22C55E',
  Loading: '#F59E0B',
  Error: '#EF4444',
};

export default function ControlCenter({
  visible,
  webViewStatus,
  onNavigateToSubscription,
  onClose,
}: Props): React.JSX.Element {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(
    Config.DEFAULT_LANGUAGE,
  );

  const handleSelectLanguage = useCallback((lang: SupportedLanguage): void => {
    Logger.info(`Language selected: ${lang}`);
    setSelectedLanguage(lang);
  }, []);

  const handleSubscription = useCallback((): void => {
    Logger.info('Navigating to Subscription from Control Center');
    onClose();
    // Defer navigation slightly to let the modal close animation complete.
    setTimeout(onNavigateToSubscription, 300);
  }, [onClose, onNavigateToSubscription]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop — tap outside the sheet to dismiss */}
      <TouchableWithoutFeedback onPress={onClose} accessibilityLabel="Close Control Center">
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        {/* Drag handle */}
        <View style={styles.handle} />

        <Text style={styles.title}>Control Center</Text>

        {/* ── WebView Status ── */}
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[webViewStatus] }]} />
          <Text style={styles.statusLabel}>
            WebView: <Text style={styles.statusValue}>{webViewStatus}</Text>
          </Text>
        </View>

        {/* ── Language Selector ── */}
        <Text style={styles.sectionLabel}>Target Language</Text>
        <View style={styles.languageRow}>
          {Config.SUPPORTED_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageChip,
                selectedLanguage === lang && styles.languageChipActive,
              ]}
              onPress={() => handleSelectLanguage(lang as SupportedLanguage)}
              activeOpacity={0.75}
              accessibilityLabel={`Select language ${lang}`}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedLanguage === lang }}
            >
              <Text
                style={[
                  styles.languageChipText,
                  selectedLanguage === lang && styles.languageChipTextActive,
                ]}
              >
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Start Translation (disabled, Phase-2) ── */}
        <TouchableOpacity
          style={styles.translationButton}
          disabled
          activeOpacity={1}
          accessibilityLabel="Start Translation — unavailable in Phase 1"
          accessibilityState={{ disabled: true }}
        >
          <Text style={styles.translationButtonText}>Start Translation</Text>
        </TouchableOpacity>
        <Text style={styles.tooltipText}>
          Phase 2: Video detection & translation pipeline will enable this.
        </Text>

        {/* ── Subscription ── */}
        <TouchableOpacity
          style={styles.subscriptionButton}
          onPress={handleSubscription}
          activeOpacity={0.85}
          accessibilityLabel="View subscription plans"
          accessibilityRole="button"
        >
          <Text style={styles.subscriptionButtonText}>Subscription</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDDDDD',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 20,
    textAlign: 'center',
  },
  // Status row
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#444444',
  },
  statusValue: {
    fontWeight: '700',
    color: '#111111',
  },
  // Language selector
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  languageChip: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  languageChipActive: {
    backgroundColor: '#FF6600',
    borderColor: '#FF6600',
  },
  languageChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555555',
  },
  languageChipTextActive: {
    color: '#FFFFFF',
  },
  // Start Translation (disabled)
  translationButton: {
    width: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 6,
  },
  translationButtonText: {
    color: '#AAAAAA',
    fontSize: 16,
    fontWeight: '700',
  },
  tooltipText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 17,
  },
  // Subscription
  subscriptionButton: {
    width: '100%',
    backgroundColor: '#FF6600',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  subscriptionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
