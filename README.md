# VAULT — Mobile App

> A  multi-currency wallet and live forex analytics mobile app — built with React Native and Expo.

<br />

<br />

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Building the APK](#building-the-apk)
- [Architecture Notes](#architecture-notes)
- [Related Repository](#related-repository)
- [Author](#author)

---

## Overview

This is the mobile frontend for **VAULT** — a full-stack fintech application. The app connects to a Django REST backend to display live multi-currency wallet balances, execute currency conversions, and visualise 90-day forex trends through a custom-built line chart.

Designed with a dark trading terminal aesthetic: deep navy backgrounds, electric green accents, and monospaced typography — inspired by Bloomberg Terminal and professional trading platforms.

---

## Features

- 🔐 **Secure Auth** — Login and registration wired to the Django backend, with persistent sessions via AsyncStorage
- 💼 **Wallet Home** — Real-time balance cards across all held currencies with pull-to-refresh
- ⇄ **Currency Conversion** — Bottom sheet modal with live rate preview before executing a conversion
- 💸 **Deposits** — Fund (TEST LAYER) any currency wallet directly from the app
- 📡 **Live Rates Ticker** — Exchange rates auto-refresh every 10 seconds via open.er-api.com
- 📉 **90-Day Line Chart** — Custom zero-dependency chart built with plain React Native Views — no charting library needed (tried to avoid the dependency overhead)
- 🗂️ **Transaction History** — Filterable, colour-coded ledger (green deposits · red withdrawals · amber conversions)
- 📴 **Offline Handling** — User-friendly "Please turn on your internet connection" messages instead of raw Java exceptions
- 🎨 **Dark Terminal UI** — Consistent design system across all screens with no external UI library

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (JavaScript) |
| Navigation | Expo Router (file-based routing) |
| Auth State | React Context API + AsyncStorage |
| Styling | React Native StyleSheet (no UI library) |
| Live Rates | open.er-api.com (no key) |
| Historical Data | Frankfurter API (major pairs) |
| Build Tool | EAS — Expo Application Services |

---

## Screenshots

> 💡 *Dark trading terminal aesthetic — deep navy backgrounds, electric green accents.*

<br />

### Authentication

| Login | Register |
|---|---|
| <!-- Screenshot: Login screen with VAULT branding, ticker, and ACCESS ACCOUNT button --> | <!-- Screenshot: Register screen with feature list card at bottom --> |
| ![Login](screenshots/login.png) | ![Register](screenshots/register.png) |

<br />

### Wallet

| Home — Balances | Conversion Modal | Deposit Modal |
|---|---|---|
| ![Wallet Home](screenshots/wallet_home.png) | ![Convert](screenshots/convert_modal.png) | ![Deposit](screenshots/deposit_modal.png) |

<br />

### Analytics

| Live Rates Grid | 90-Day Chart — EUR/USD | Pair Selector |
|---|---|---|
| ![Live Rates](screenshots/live_rates.png) | ![Chart](screenshots/chart_eurusd.png) | ![Pairs](screenshots/pair_selector.png) |

<br />

### Transaction History

| All Transactions | Filtered View |
|---|---|
| ![Transactions](screenshots/transactions.png) | ![Filtered](screenshots/transactions_filtered.png) |

<br />

### Account & Settings

![Settings](screenshots/settings.png)

---

## Project Structure

```
vault-mobile/
│
├── app/
│   ├── _layout.js              # Root layout — AuthProvider + AuthGuard + Stack
│   ├── (auth)/
│   │   ├── _layout.js          # Auth stack navigator
│   │   ├── login.js            # Login screen
│   │   └── register.js         # Registration screen
│   └── (tabs)/
│       ├── _layout.js          # Bottom tab navigator with custom icons
│       ├── index.js            # Tab 1: Wallet Home
│       ├── analytics.js        # Tab 2: Market Watch
│       ├── transactions.js     # Tab 3: Transaction History
│       └── settings.js         # Tab 4: Account
│
├── context/
│   └── AuthContext.js          # Global auth state, authFetch helper, AsyncStorage
│
├── constants/
│   └── api.js                  # BASE_URL, ENDPOINTS, currency maps, Frankfurter helpers
│
├── assets/
│   ├── icon.png                # App icon (1024x1024)
│   ├── adaptive-icon.png       # Android adaptive icon foreground (1024x1024)
│   └── splash.png              # Splash screen image
│
└── app.json                    # Expo config — name, icon, splash, EAS plugin
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo Go app on your phone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
- The [vault-backend](https://github.com/Wise-zino/vault-backend) running locally or deployed

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Wise-zino/vault.git
cd vault-mobile

# 2. Install dependencies
npm install

# 3. Install AsyncStorage
npx expo install @react-native-async-storage/async-storage

# 4. Update the backend URL (see Configuration below)

# 5. Start the development server
npx expo start

# 6. Scan the QR code with Expo Go on your phone
#    or press 'a' for Android emulator / 'i' for iOS simulator
```

---

## Configuration

Open `constants/api.js` and update `BASE_URL` to point to your backend:

```js
// Local development on the same WiFi network
export const BASE_URL = 'http://192.168.x.x:8000';

// Or your deployed backend
export const BASE_URL = 'https://your-service-domain';
```

> ⚠️ `localhost` won't work on a physical device — use your machine's local IP address instead.
> Find it with `ipconfig` (Windows) or `ifconfig` (Mac/Linux).

---

## Building the APK

### Prerequisites
```bash
npm install -g eas-cli
eas login
eas init   # first time only — links project to your Expo account
```

### Preview APK (install directly on Android)
```bash
eas build --platform android --profile preview
```

### Production AAB (Google Play Store)
```bash
eas build --platform android --profile production
```

Make sure your `eas.json` is configured:

```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "aab" }
    }
  }
}
```

> ⚠️ Update `BASE_URL` to your production backend URL before building.

---

## Architecture Notes

### Why Expo Router?
File-based routing like Next.js — every file in `app/` is a route. Route groups like `(auth)` and `(tabs)` organise screens without affecting the navigation path.

### Auth Guard
`app/_layout.js` runs an `AuthGuard` component that watches the user's login state and redirects automatically — unauthenticated users always land on login, authenticated users always land on the wallet. The guard waits for AsyncStorage to finish loading before redirecting to avoid the blank screen bug.

### authFetch()
Every API call to the Django backend goes through `authFetch()` in `AuthContext.js` — it automatically injects the `Authorization: Token ...` header and handles 401 responses by logging the user out gracefully.

### Custom Line Chart
The 90-day forex chart is built with plain React Native `View` components and trigonometry — no charting library dependency. Each line segment is a rotated rectangle calculated using Pythagoras' theorem and `Math.atan2`.

### Offline Errors
Raw network exceptions (e.g. `java.net.UnknownHostException`) are caught in `authFetch()` and mapped to the message *"Please turn on your internet connection"* — no internal implementation details exposed to the user.

---

## Related Repository

This is the mobile frontend. The Django backend is in a separate repository:

👉 **[vault-backend](https://github.com/Wise-zino/vault-backend)** — Django REST Framework API + Pandas backtester

---

## Author

**Wise Zino**
- Portfolio: [wisezino.vercel.app]
- GitHub: [@Wise-zino](https://github.com/Wise-zino)
- LinkedIn: [wise-ewomazino](https://linkedin.com/in/wise-ewomazino)

---

<div align="center">

*React Native · Expo Router · Django · Frankfurter API*

</div>
