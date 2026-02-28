/**
 * Shared type definitions for the Home feature slice.
 * Kept here so both HomeScreen and ControlCenter reference a single source of truth.
 */

/** Reflects the current load state of the embedded WebView. */
export type WebViewStatus = 'Ready' | 'Loading' | 'Error';

/**
 * ISO 639-1 language codes supported by the translation pipeline.
 * Re-exported from the core translation domain so that this file
 * remains the single import location for all Home-slice consumers.
 */
export type { SupportedLanguage } from '../../core/translation/types';
