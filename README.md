# GlobalVox

**GlobalVox** is an institutional-grade Expo React Native application that delivers AI-powered social-media dubbing. This repository contains the Phase-1 MVP — a production-ready foundation built for long-term scalability, not a throwaway prototype.

---

## Architecture

The codebase follows a **Clean Layered Architecture** that enforces strict separation of concerns and makes every module independently testable and replaceable.

```
src/
├── core/                    # Infrastructure-level utilities (no business logic)
│   ├── config/              # Central configuration — single source of truth for all env-sensitive values
│   ├── logger/              # Structured logging utility — replaces raw console.log calls
│   └── error-boundary/      # Root React error boundary — captures and recovers from render failures
│
├── navigation/              # Navigation topology
│   ├── types.ts             # Typed RootStackParamList — authoritative param definitions
│   └── RootNavigator.tsx    # Stack navigator — all screen registrations in one place
│
└── features/                # Vertical slices (one folder per product feature)
    ├── home/                # Phase-1: Instagram WebView + GlobalVox FAB
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
- **Central config module** (`src/core/config/index.ts`) stores every environment-sensitive value (URLs, plan details). In Phase-2, these values will be sourced from EAS environment variables via `expo-constants`.
- **Logger utility** (`src/core/logger/index.ts`) wraps `console.*` behind a structured interface. Debug/info output is suppressed in production builds via Metro's `__DEV__` branch elimination.
- **Error boundary** (`src/core/error-boundary/AppErrorBoundary.tsx`) ensures that render errors are caught at the root, logged via the Logger, and presented as a recoverable UI rather than a hard crash.
- **Typed navigation** (`src/navigation/types.ts`) provides a single `RootStackParamList` consumed by all screen components for compile-time safety.

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

## Phase-1 Scope (current)

| Feature | Status |
|---|---|
| Instagram WebView (fullscreen, no header) | ✅ Delivered |
| GlobalVox FAB (orange, bottom-right) | ✅ Delivered |
| Subscription screen — GlobalVox Pro $20/month | ✅ Delivered |
| Typed navigation (Home → Subscription) | ✅ Delivered |
| Root error boundary | ✅ Delivered |
| Structured logging | ✅ Delivered |
| Central config module | ✅ Delivered |

**Explicitly out of scope in Phase-1:** audio playback, backend calls, scraping logic, payment processing.

---

## Phase-2 Roadmap

| Area | Planned work |
|---|---|
| **Config** | Source `INSTAGRAM_URL` and plan data from EAS environment variables via `expo-constants` |
| **Payments** | Integrate RevenueCat (iOS/Android in-app purchases) behind the Continue button |
| **Auth** | Firebase Authentication — email/social sign-in |
| **Translation engine** | Stream translated audio segments from a managed API; replace WebView playback |
| **Monitoring** | Replace Logger stub with Sentry (`sentry-expo`) for remote error tracking and session replay |
| **Testing** | Jest + React Native Testing Library unit tests for all `core/` and `features/` modules |
| **CI/CD** | EAS Build + EAS Submit pipelines on GitHub Actions |

---

## Security Summary

Runtime dependencies carry **0 known vulnerabilities** at the time of this release. The `tar` advisory warnings surfaced by `npm audit` are transitive development-tool dependencies inside `@expo/cli` and are not bundled into the application.

