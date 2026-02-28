/**
 * Phase-2 video-detection bridge scaffold.
 *
 * Provides the JavaScript injected into the WebView to passively detect
 * <video> elements on the page.  Detection is purely observational:
 *   - No audio is accessed or played.
 *   - No network requests are initiated.
 *   - No page content is scraped or exfiltrated.
 *
 * Detected metadata is forwarded to React Native via
 * window.ReactNativeWebView.postMessage so the host app can reflect the
 * detection state in the UI (Control Center status row).
 *
 * Constraints honoured:
 *   - No expo-av / no audio.
 *   - No backend calls.
 *   - TypeScript strict — payload type is exported and used on the RN side.
 */

// ─── Payload type ─────────────────────────────────────────────────────────────

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

// ─── Injected JavaScript ──────────────────────────────────────────────────────

/**
 * IIFE injected via the WebView `injectedJavaScript` prop on every page load.
 *
 * Behaviour:
 *  1. Immediately scans the DOM and reports any existing <video> elements.
 *  2. Installs a MutationObserver that watches for <video> elements inserted
 *     dynamically (Instagram is an SPA; videos are loaded lazily as the user
 *     scrolls).
 *  3. All errors are swallowed inside the IIFE so the injected script can
 *     never crash the host page.
 *
 * The string must end with `true;` — react-native-webview requires the last
 * expression to evaluate to `true` on Android.
 */
export const VIDEO_DETECTOR_JS = `(function () {
  'use strict';

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
})();
true;
`;
