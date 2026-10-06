# App Building & Release Guide

This document contains step-by-step instructions for building the Workout Tracker App for release, both locally via Gradle and in the cloud via Expo Application Services (EAS).

---

## 1. Prerequisites

### Local Environment Requirements
- **Node.js**: LTS version (v18+)
- **JDK**: Java 17 (`openjdk 17`)
- **Android SDK**: `ANDROID_HOME` configured (e.g. `~/Android/Sdk` or platform-tools on PATH)
- **Dependencies**: Installed via `npm install`

---

## 2. Local Android Builds (Fastest & Recommended)

Local builds use Gradle directly on your machine. Once the initial build caches native dependencies, incremental rebuilds take only **1 to 3 minutes**.

### Option A: Build Standalone Release APK (Direct Device Installation)

Use this method to generate an installable `.apk` file that you can transfer directly to any Android phone or test emulator.

#### Step 1: Prebuild Native Android Files (if configs/assets changed)
Run this whenever you edit `app.json`, add native packages, or update icons/splash screens:
```bash
npx expo prebuild --platform android --clean
```

#### Step 2: Assemble Release APK
```bash
./android/gradlew -p android assembleRelease
```

#### Output Location:
```text
android/app/build/outputs/apk/release/app-release.apk
```

#### Install on a Connected Android Device / Emulator:
```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

---

### Option B: Build Google Play Store Bundle (.aab)

Use this method when publishing an official release to the **Google Play Console**.

```bash
./android/gradlew -p android bundleRelease
```

#### Output Location:
```text
android/app/build/outputs/bundle/release/app-release.aab
```

---

### Option C: One-Step Build & Run (Connected Phone / Emulator)
To compile a release build and automatically deploy/launch it on a connected device in one step:
```bash
npx expo run:android --variant release
```

---

## 3. Cloud Builds with EAS (Expo Application Services)

Use EAS if you do not want to use local CPU/RAM, or if you need an easily shareable link or cloud-managed signing credentials.

### Setup (First-Time Only)
1. Ensure EAS CLI is installed:
   ```bash
   npx eas-cli login
   ```
2. Initialize build configuration (creates `eas.json`):
   ```bash
   npx eas-cli build:configure
   ```

### Option A: Build Shareable APK (Preview Profile)
```bash
npx eas-cli build -p android --profile preview
```

#### How to Retrieve the APK:
1. **Terminal**: A direct download URL and QR code will appear directly in the terminal upon build completion.
2. **Expo Dashboard**: Navigate to [expo.dev](https://expo.dev) > Select Project > Builds > Click **Download**.
3. **CLI**: Run `npx eas-cli build:list` to view and download past builds.

---

### Option B: Build Google Play Store Bundle (Production Profile)
```bash
npx eas-cli build -p android --profile production
```
Produces an optimized `.aab` file ready for submission to Google Play Console.

---

## 4. Gradle vs Cloud (EAS) Comparison

| Feature | Local Gradle (`./gradlew`) | Cloud EAS Build |
| :--- | :--- | :--- |
| **First Build Time** | ~15 - 22 mins (initial NDK/CMake caching) | ~10 - 15 mins |
| **Subsequent Builds** | **~1 - 3 mins** (reuses local cache) | ~8 - 15 mins (every build) |
| **Queue Time** | **0 seconds** (instant) | 5 - 20 mins on free tier during peak hours |
| **Network Reliance** | Zero (works offline once packages installed) | Uploads codebase & downloads 120MB APK |
| **Resource Usage** | Local CPU & RAM | Cloud workers (0 local CPU used) |
| **Best For** | Daily development, fast testing, local APK | Remote builds, CI/CD pipelines, sharing links |

---

## 5. Pre-Release Verification Checklist

Before running any release build, execute the verification suite:

```bash
# 1. Typecheck
npx tsc --noEmit

# 2. Lint
npx expo lint

# 3. Expo Doctor Diagnostics
npx expo-doctor
```
Ensure all 3 checks report 0 errors before generating the production artifact.
