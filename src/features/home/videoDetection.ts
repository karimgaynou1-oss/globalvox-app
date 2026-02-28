/**
 * Phase-2/3 video-detection bridge scaffold.
 *
 * Provides the JavaScript injected into the WebView to passively detect
 * <video> elements on the page.  Detection is purely observational:
 *   - No audio is accessed or played.
 *   - No network requests are initiated.
 *   - No page content is scraped or exfiltrated.
 *
 * Two message types are emitted to React Native via
 * window.ReactNativeWebView.postMessage:
 *
 *   VIDEO_DETECTED  — mutation-driven: fires whenever a <video> is added to
 *                     the DOM.  Carries count + http/https src list (Phase-2).
 *
 *   VIDEO_CONTEXT   — interval-driven: fires every 1 s while a <video> exists.
 *                     Carries only non-sensitive playback metadata (Phase-3).
 *                     No media URLs, no downloading, no scraping.
 *
 * Constraints honoured:
 *   - No expo-av / no audio.
 *   - No backend calls.
 *   - TypeScript strict — payload types are exported and used on the RN side.
 */

// ─── Payload types ────────────────────────────────────────────────────────────

/**
 * Shape of the JSON payload posted from the injected JS back to React Native.
 * The `type` discriminant is intentionally narrow so that future bridge
 * messages can share the same `onMessage` handler with a union switch.
 */
export interface VideoDetectionPayload {
  type: 'VIDEO_DETECTED';
  /** Number of <video> elements visible in the DOM at the time of posting. */
  count: number;
  /**
   * `src` attributes of detected video elements that have an http/https URL.
   * Elements with blob: or empty `src` values are omitted because they are
   * ephemeral MSE URLs that carry no useful metadata for the Phase-2 pipeline.
   * Note: `srcs.length` may therefore be less than `count`.
   */
  srcs: string[];
}

/**
 * Non-sensitive video playback context emitted at a fixed 1-second interval
 * (Phase-3).  Used by the Control Center to reflect live playback state and
 * to gate the "Start Translation" button.
 *
 * Only metadata derivable from the HTMLVideoElement API is included.
 * No media URLs, no network requests, no content scraping.
 */
export interface VideoContextPayload {
  type: 'VIDEO_CONTEXT';
  payload: {
    /** Total number of <video> elements in the DOM at the time of posting. */
    detectedVideoCount: number;
    /** True when at least one <video> is present and currently playing. */
    active: boolean;
    /** `currentTime` of the active video in seconds (0 if none). */
    currentTimeSec: number;
    /** `duration` of the active video in seconds (0 if none or NaN). */
    durationSec: number;
    /** Whether the active video is paused (true if none). */
    paused: boolean;
    /** Whether the active video is muted (true if none). */
    muted: boolean;
  };
}

/** Typed union of every message the WebView bridge can emit to React Native. */
export type WebViewMessage = VideoDetectionPayload | VideoContextPayload;

// ─── Runtime validation ───────────────────────────────────────────────────────

/**
 * Validate and narrow an unknown JSON value to a `WebViewMessage`.
 * Returns `null` for any message that does not match a known shape so the
 * caller can safely discard it without affecting app state.
 */
export function parseWebViewMessage(raw: unknown): WebViewMessage | null {
  if (raw === null || typeof raw !== 'object') {
    return null;
  }
  const msg = raw as Record<string, unknown>;

  if (msg['type'] === 'VIDEO_DETECTED') {
    if (typeof msg['count'] !== 'number') return null;
    if (!Array.isArray(msg['srcs'])) return null;
    return {
      type: 'VIDEO_DETECTED',
      count: msg['count'] as number,
      srcs: (msg['srcs'] as unknown[]).filter((s): s is string => typeof s === 'string'),
    };
  }

  if (msg['type'] === 'VIDEO_CONTEXT') {
    const p = msg['payload'];
    if (p === null || typeof p !== 'object') return null;
    const pl = p as Record<string, unknown>;
    if (
      typeof pl['detectedVideoCount'] !== 'number' ||
      typeof pl['active'] !== 'boolean' ||
      typeof pl['currentTimeSec'] !== 'number' ||
      typeof pl['durationSec'] !== 'number' ||
      typeof pl['paused'] !== 'boolean' ||
      typeof pl['muted'] !== 'boolean'
    ) {
      return null;
    }
    return {
      type: 'VIDEO_CONTEXT',
      payload: {
        detectedVideoCount: pl['detectedVideoCount'] as number,
        active: pl['active'] as boolean,
        currentTimeSec: pl['currentTimeSec'] as number,
        durationSec: pl['durationSec'] as number,
        paused: pl['paused'] as boolean,
        muted: pl['muted'] as boolean,
      },
    };
  }

  return null;
}

// ─── Injected JavaScript ──────────────────────────────────────────────────────

/**
 * IIFE injected via the WebView `injectedJavaScript` prop on every page load.
 *
 * Behaviour:
 *  1. Immediately scans the DOM and reports any existing <video> elements
 *     as a VIDEO_DETECTED message.
 *  2. Installs a MutationObserver that watches for <video> elements inserted
 *     dynamically (Instagram is an SPA; videos are loaded lazily as the user
 *     scrolls) and posts VIDEO_DETECTED on each insertion.
 *  3. Starts a 1-second interval that posts VIDEO_CONTEXT while at least one
 *     <video> is present.  Only non-sensitive playback metadata is included:
 *     count, active, currentTimeSec, durationSec, paused, muted.
 *     No media URLs are transmitted.
 *  4. All errors are swallowed inside the IIFE so the injected script can
 *     never crash the host page.
 *
 * The string must end with `true;` — react-native-webview requires the last
 * expression to evaluate to `true` on Android.
 */
export const VIDEO_DETECTOR_JS = `(function () {
  'use strict';

  // ── VIDEO_DETECTED helpers ──────────────────────────────────────────────────

  function collectVideos() {
    var videos = document.querySelectorAll('video');
    var srcs = [];
    for (var i = 0; i < videos.length; i++) {
      var src = videos[i].src;
      // Only include http/https URLs. Blob and empty src values are excluded
      // because they are ephemeral or carry no useful metadata for Phase-2.
      if (src && (src.indexOf('http://') === 0 || src.indexOf('https://') === 0)) {
        srcs.push(src);
      }
    }
    return { type: 'VIDEO_DETECTED', count: videos.length, srcs: srcs };
  }

  function postVideos() {
    try {
      var payload = collectVideos();
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    } catch (e) {
      // Bridge may not be initialised yet — silently ignore.
    }
  }

  // Report any videos already in the DOM when the script first runs.
  postVideos();

  // Watch for dynamically inserted video elements.
  try {
    var observer = new MutationObserver(function (mutations) {
      for (var m = 0; m < mutations.length; m++) {
        var added = mutations[m].addedNodes;
        for (var n = 0; n < added.length; n++) {
          var node = added[n];
          if (node.nodeType === 1) {
            if (
              node.nodeName === 'VIDEO' ||
              (typeof node.querySelector === 'function' && node.querySelector('video'))
            ) {
              postVideos();
              break;
            }
          }
        }
      }
    });

    var root = document.body || document.documentElement;
    observer.observe(root, { childList: true, subtree: true });
  } catch (e) {
    // MutationObserver unavailable — initial scan is still reported above.
  }

  // ── VIDEO_CONTEXT interval (Phase-3) ────────────────────────────────────────
  // Posts non-sensitive playback metadata every 1 s while videos are present.
  // No media URLs, no network requests, no content scraping.

  function getActiveVideo(videos) {
    // Prefer a currently-playing video.
    for (var i = 0; i < videos.length; i++) {
      if (!videos[i].paused && !videos[i].ended) {
        return videos[i];
      }
    }
    // Fall back to the first video (may be paused).
    return videos.length > 0 ? videos[0] : null;
  }

  function buildVideoContext() {
    var videos = document.querySelectorAll('video');
    var count = videos.length;
    var active = getActiveVideo(videos);
    var isActive = active !== null && !active.paused && !active.ended;
    var dur = active ? active.duration : NaN;
    return {
      type: 'VIDEO_CONTEXT',
      payload: {
        detectedVideoCount: count,
        active: isActive,
        currentTimeSec: active ? (active.currentTime || 0) : 0,
        durationSec: active && isFinite(dur) ? dur : 0,
        paused: active ? active.paused : true,
        muted: active ? active.muted : true
      }
    };
  }

  setInterval(function () {
    try {
      var videos = document.querySelectorAll('video');
      if (videos.length === 0) { return; }
      window.ReactNativeWebView.postMessage(JSON.stringify(buildVideoContext()));
    } catch (e) {
      // Bridge not ready or WebView being torn down — ignore.
    }
  }, 1000);

})();
true;
`;
