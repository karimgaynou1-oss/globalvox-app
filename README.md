# GlobalVox

**GlobalVox** is an institutional-grade Expo React Native application that delivers AI-powered social-media dubbing. This repository contains the Phase-3 job orchestration layer — a production-ready scaffold built on top of the Phase-1+2 foundation so that Phase-4 can plug in real STT/Translation/TTS.

---

## Architecture

The codebase follows a **Clean Layered Architecture** that enforces strict separation of concerns and makes every module independently testable and replaceable.

```
src/
├── core/                    # Infrastructure-level utilities (no business logic)
│   ├── config/              # Central configuration — single source of truth for all env-sensitive values
│   ├── logger/              # Structured logging utility — replaces raw console.log calls
│   ├── error-boundary/      # Root React error boundary — captures and recovers from render failures
│   └── translation/         # Translation domain (Phase-3)
│       ├── types.ts          #   Domain types: SupportedLanguage, TranslationJob, TranslationService
│       └── MockTranslationService.ts  # Timer-based mock — replaced by LiveTranslationService in Phase-4
│
├── navigation/              # Navigation topology
│   ├── types.ts             # Typed RootStackParamList — authoritative param definitions
│   └── RootNavigator.tsx    # Stack navigator — all screen registrations in one place
│
└── features/                # Vertical slices (one folder per product feature)
    ├── home/                # Phase-1/2/3: Instagram WebView + GlobalVox FAB + ControlCenter
    │   ├── videoDetection.ts #   Injected JS bridge: VIDEO_DETECTED + VIDEO_CONTEXT; typed union + validator
    │   ├── types.ts          #   Feature-level types (WebViewStatus; re-exports SupportedLanguage)
    │   ├── HomeScreen.tsx    #   Screen: WebView, bridge handling, job orchestration
    │   └── ControlCenter.tsx #   Bottom-sheet: status, video state, language selector, progress bar
    └── subscription/        # Phase-1: GlobalVox Pro plan presentation
```

### Layer Contracts

| Layer | Depends on | Must NOT depend on |
|---|---|---|
| `core/` | React Native primitives | `features/`, `navigation/` |
| `navigation/` | `core/`, `features/` | — |
| `features/` | `core/`, `navigation/types` | Other features directly |

### Key Design Decisions

- **`App.tsx` is a thin composition root.** It mounts the error boundary, provides the navigation context, and delegates routing — nothing else.
- **Central config module** (`src/core/config/index.ts`) stores every environment-sensitive value (URLs, plan details). In Phase-4, these values will be sourced from EAS environment variables via `expo-constants`.
- **Logger utility** (`src/core/logger/index.ts`) wraps `console.*` behind a structured interface. Debug/info output is suppressed in production builds via Metro's `__DEV__` branch elimination.
- **Error boundary** (`src/core/error-boundary/AppErrorBoundary.tsx`) ensures that render errors are caught at the root, logged via the Logger, and presented as a recoverable UI rather than a hard crash.
- **Typed navigation** (`src/navigation/types.ts`) provides a single `RootStackParamList` consumed by all screen components for compile-time safety.

---

## Phase-3 Flow

### Video Context Bridge (WebView → React Native)

```
Instagram page (WebView)
  │
  │  [MutationObserver]        VIDEO_DETECTED  { type, count, srcs[] }
  │─────────────────────────────────────────────────────────────────► RN
  │
  │  [setInterval 1 s]         VIDEO_CONTEXT   { type, payload: {
  │                                               detectedVideoCount,
  │                                               active, currentTimeSec,
  │                                               durationSec, paused, muted
  │                                             } }
  │─────────────────────────────────────────────────────────────────► RN
```

No media URLs, no network requests, no content scraping — only metadata derivable from the HTMLVideoElement DOM API.

### Translation Job Lifecycle

```
ControlCenter presses "Start Translation"
  │
  ▼
HomeScreen.handleStartTranslation(language)
  │
  ▼
MockTranslationService.start(input, onUpdate)
  │   (Phase-4: LiveTranslationService calls STT/MT/TTS APIs)
  │
  ├─ job.status = 'running',  progressPct = 0
  ├─ timer tick every 500 ms → progressPct += …
  ├─ progressPct = 100 → job.status = 'done'
  │
  └─ each tick: onUpdate(job) → setCurrentJob → ControlCenter re-renders
                                                  progress bar + status text

User presses "Cancel"
  │
  ▼
MockTranslationService.cancel(jobId)
  └─ clears timer, emits idle snapshot → setCurrentJob(null)
```

### Job Status State Machine

```
         ┌──────────────────────────────────────────┐
         │                                          │
   ──►  idle  ──start()──►  running  ──done──►  done
                               │
                           cancel()
                               │
                               ▼
                             idle
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Install

```bash
npm install
```

### Run

```bash
# Start Expo dev server
npm start

# iOS simulator
npm run ios

# Android emulator
npm run android
```

---

## Phase Delivery Summary

| Phase | Feature | Status |
|---|---|---|
| **1** | Instagram WebView (fullscreen, no header) | ✅ Delivered |
| **1** | GlobalVox FAB (orange, bottom-right) | ✅ Delivered |
| **1** | Subscription screen — GlobalVox Pro $20/month | ✅ Delivered |
| **1** | Typed navigation (Home → Subscription) | ✅ Delivered |
| **1** | Root error boundary | ✅ Delivered |
| **1** | Structured logging | ✅ Delivered |
| **1** | Central config module | ✅ Delivered |
| **2** | `VIDEO_DETECTED` bridge — MutationObserver + count | ✅ Delivered |
| **2** | ControlCenter: WebView status + video count rows | ✅ Delivered |
| **3** | `VIDEO_CONTEXT` bridge — 1 s interval, playback metadata | ✅ Delivered |
| **3** | Typed `WebViewMessage` union + `parseWebViewMessage()` validator | ✅ Delivered |
| **3** | `TranslationJob` domain model + `TranslationService` interface | ✅ Delivered |
| **3** | `MockTranslationService` — timer-based progress simulation | ✅ Delivered |
| **3** | ControlCenter: active video state row | ✅ Delivered |
| **3** | ControlCenter: "Start Translation" gated on active video | ✅ Delivered |
| **3** | ControlCenter: progress bar + status text while running | ✅ Delivered |
| **3** | ControlCenter: "Cancel" button while running | ✅ Delivered |

---

## Phase-4 Integration Points

Phase-4 will plug real STT/Translation/TTS into the job orchestration scaffold without changing any type contracts:

| Integration point | File | What Phase-4 replaces |
|---|---|---|
| `TranslationService` interface | `src/core/translation/types.ts` | Implement `LiveTranslationService` that calls real APIs |
| `MockTranslationService` | `src/core/translation/MockTranslationService.ts` | Swap for `LiveTranslationService` in HomeScreen's `useMemo` |
| `VIDEO_CONTEXT` payload | `src/features/home/videoDetection.ts` | Feed `currentTimeSec`/`durationSec` to the STT segmenter |
| `HomeScreen` job orchestration | `src/features/home/HomeScreen.tsx` | Wire real audio capture behind `onStartTranslation` |
| Config `INSTAGRAM_URL` | `src/core/config/index.ts` | Source from EAS environment variables |

**Explicitly out of scope in Phase-3:** audio playback, STT, machine translation, TTS, backend calls, payment processing.

---

## Security Summary

Runtime dependencies carry **0 known vulnerabilities** at the time of this release. The `tar` advisory warnings surfaced by `npm audit` are transitive development-tool dependencies inside `@expo/cli` and are not bundled into the application.

