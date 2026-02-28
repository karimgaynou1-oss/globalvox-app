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
import { VideoContextPayload } from './videoDetection';
import { TranslationJob } from '../../core/translation/types';
import Config from '../../core/config';
import Logger from '../../core/logger';

interface Props {
  visible: boolean;
  webViewStatus: WebViewStatus;
  /** Number of <video> elements detected on the current page (Phase-2 bridge). */
  detectedVideoCount: number;
  /** Latest playback context from the VIDEO_CONTEXT bridge (Phase-3). */
  videoContext: VideoContextPayload['payload'] | null;
  /** Current translation job snapshot (null when no job is in flight). */
  currentJob: TranslationJob | null;
  onStartTranslation: (language: SupportedLanguage) => void;
  onCancelTranslation: () => void;
  onNavigateToSubscription: () => void;
  onClose: () => void;
}

/** Maps WebViewStatus to a display colour for the status indicator dot. */
const STATUS_COLOR: Record<WebViewStatus, string> = {
  Ready: '#22C55E',
  Loading: '#F59E0B',
  Error: '#EF4444',
};

/** Colour for the video-detection dot when at least one video is present. */
const VIDEO_DETECTED_COLOR = '#22C55E';
/** Colour for the video-detection dot when no videos have been detected. */
const VIDEO_NONE_COLOR = '#DDDDDD';

export default function ControlCenter({
  visible,
  webViewStatus,
  detectedVideoCount,
  videoContext,
  currentJob,
  onStartTranslation,
  onCancelTranslation,
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

  const handleStartTranslation = useCallback((): void => {
    Logger.info('Start Translation pressed');
    onStartTranslation(selectedLanguage);
  }, [onStartTranslation, selectedLanguage]);

  // Derived state
  const isJobRunning = currentJob !== null && currentJob.status === 'running';
  const isJobDone = currentJob !== null && currentJob.status === 'done';
  const progressPct = currentJob?.progressPct ?? 0;

  // "Start Translation" is enabled only when an active video is detected and
  // no job is currently running or done (done resets after user interaction).
  const hasActiveVideo = videoContext !== null && videoContext.active;
  const canStartTranslation = hasActiveVideo && !isJobRunning && !isJobDone;

  // Human-readable playback state label
  const videoStateLabel: string = (() => {
    if (videoContext === null || videoContext.detectedVideoCount === 0) return 'No video';
    return videoContext.active ? 'Playing' : 'Paused';
  })();

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

        {/* ── Video Detection (Phase-2 bridge) ── */}
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: detectedVideoCount > 0 ? VIDEO_DETECTED_COLOR : VIDEO_NONE_COLOR }]} />
          <Text style={styles.statusLabel}>
            Videos detected: <Text style={styles.statusValue}>{detectedVideoCount}</Text>
          </Text>
        </View>

        {/* ── Active Video State (Phase-3 bridge) ── */}
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: hasActiveVideo ? VIDEO_DETECTED_COLOR : VIDEO_NONE_COLOR }]} />
          <Text style={styles.statusLabel}>
            Video state: <Text style={styles.statusValue}>{videoStateLabel}</Text>
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

        {/* ── Translation Job Progress (shown while running or done) ── */}
        {(isJobRunning || isJobDone) && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
            </View>
            <Text style={styles.progressLabel}>
              {isJobDone
                ? 'Translation complete ✓'
                : `Translating… ${progressPct}%`}
            </Text>
          </View>
        )}

        {/* ── Start Translation / Cancel ── */}
        {isJobRunning ? (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancelTranslation}
            activeOpacity={0.85}
            accessibilityLabel="Cancel translation"
            accessibilityRole="button"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.translationButton, canStartTranslation && styles.translationButtonActive]}
              onPress={canStartTranslation ? handleStartTranslation : undefined}
              disabled={!canStartTranslation}
              activeOpacity={canStartTranslation ? 0.85 : 1}
              accessibilityLabel={
                canStartTranslation
                  ? 'Start Translation'
                  : 'Start Translation — no active video detected'
              }
              accessibilityState={{ disabled: !canStartTranslation }}
            >
              <Text style={[styles.translationButtonText, canStartTranslation && styles.translationButtonTextActive]}>
                {isJobDone ? 'Translate Again' : 'Start Translation'}
              </Text>
            </TouchableOpacity>
            {!hasActiveVideo && (
              <Text style={styles.tooltipText}>
                A playing video must be detected to enable translation.
              </Text>
            )}
          </>
        )}

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
    marginBottom: 10,
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
    marginTop: 10,
    marginBottom: 10,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  // Progress bar
  progressContainer: {
    marginBottom: 16,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF6600',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
  },
  // Start Translation (enabled / disabled states)
  translationButton: {
    width: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 6,
  },
  translationButtonActive: {
    backgroundColor: '#FF6600',
  },
  translationButtonText: {
    color: '#AAAAAA',
    fontSize: 16,
    fontWeight: '700',
  },
  translationButtonTextActive: {
    color: '#FFFFFF',
  },
  // Cancel button
  cancelButton: {
    width: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 6,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  tooltipText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 17,
  },
  // Subscription
  subscriptionButton: {
    width: '100%',
    backgroundColor: '#FF6600',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  subscriptionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
