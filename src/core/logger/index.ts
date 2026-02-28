/**
 * Structured logging utility.
 * Debug and info messages are suppressed in production builds automatically
 * because Expo/Metro strips __DEV__ branches during release bundling.
 * Warn and error messages are always emitted so on-call engineers receive them.
 */

const TAG = '[GlobalVox]';

const Logger = {
  debug(message: string, ...context: unknown[]): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.debug(`${TAG}[DEBUG] ${message}`, ...context);
    }
  },

  info(message: string, ...context: unknown[]): void {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.info(`${TAG}[INFO] ${message}`, ...context);
    }
  },

  warn(message: string, ...context: unknown[]): void {
    // eslint-disable-next-line no-console
    console.warn(`${TAG}[WARN] ${message}`, ...context);
  },

  error(message: string, error?: unknown): void {
    // eslint-disable-next-line no-console
    console.error(`${TAG}[ERROR] ${message}`, error ?? '');
  },
};

export default Logger;
