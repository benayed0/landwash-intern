# 📱 Landwash Mobile App - Native Setup Guide

This guide will help you convert your Angular PWA to native iOS and Android apps using Capacitor.

## 🎯 Native Features We're Adding

1. **Push Notifications** - Booking alerts, team notifications
2. **Camera** - Photo uploads for ratings and documentation
3. **Geolocation** - Enhanced location services and team tracking
4. **Local Notifications** - Appointment reminders
5. **Biometric Auth** - Fingerprint/Face ID login
6. **Share** - Share booking details
7. **Background Tasks** - Offline sync and location tracking

---

## 📋 Step 1: Install Capacitor

Run these commands in your project root:

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init

# When prompted:
# App name: Landwash
# App ID: com.landwash.app (or your preferred bundle ID)
# Web asset directory: dist/landwash-intern/browser

# Add iOS and Android platforms
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
```

---

## 📋 Step 2: Install Native Plugins

Install all the native plugins we'll use:

```bash
# Push Notifications
npm install @capacitor/push-notifications

# Camera
npm install @capacitor/camera

# Geolocation
npm install @capacitor/geolocation

# Local Notifications
npm install @capacitor/local-notifications

# Share
npm install @capacitor/share

# App (for app state and info)
npm install @capacitor/app

# Haptics (for touch feedback)
npm install @capacitor/haptics

# Status Bar (for styling)
npm install @capacitor/status-bar

# Splash Screen
npm install @capacitor/splash-screen

# Network (for connection status)
npm install @capacitor/network
```

---

## 📋 Step 3: Update Angular Build Configuration

Edit `angular.json` to ensure proper build output:

```json
{
  "projects": {
    "landwash-intern": {
      "architect": {
        "build": {
          "options": {
            "outputPath": "dist/landwash-intern/browser",
            ...
          }
        }
      }
    }
  }
}
```

---

## 📋 Step 4: Configure Capacitor

Edit `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.landwash.app',
  appName: 'Landwash',
  webDir: 'dist/landwash-intern/browser',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'app.landwash.com'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a1a',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#c3ff00'
    }
  }
};

export default config;
```

---

## 📋 Step 5: Build and Sync

```bash
# Build your Angular app
npm run build

# Copy web assets to native projects
npx cap sync

# Or sync specific platforms
npx cap sync ios
npx cap sync android
```

---

## 📋 Step 6: Open Native IDEs

```bash
# Open Xcode for iOS
npx cap open ios

# Open Android Studio for Android
npx cap open android
```

---

## 🍎 iOS Specific Setup

### 1. Configure Info.plist

Add these permissions in `ios/App/App/Info.plist`:

```xml
<!-- Camera Permission -->
<key>NSCameraUsageDescription</key>
<string>Landwash needs camera access to take photos of completed services</string>

<!-- Photo Library -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Landwash needs access to your photos to upload service images</string>

<!-- Location When In Use -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Landwash needs your location to show nearby service areas</string>

<!-- Location Always (for team tracking) -->
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Landwash tracks team location to optimize service delivery</string>

<!-- Background Modes -->
<key>UIBackgroundModes</key>
<array>
  <string>location</string>
  <string>remote-notification</string>
</array>

<!-- Face ID -->
<key>NSFaceIDUsageDescription</key>
<string>Use Face ID to securely log in to Landwash</string>
```

### 2. Enable Push Notifications

1. Open project in Xcode
2. Select target "App"
3. Go to "Signing & Capabilities"
4. Click "+ Capability"
5. Add "Push Notifications"
6. Add "Background Modes" → Check "Remote notifications"

### 3. Configure App Icon and Splash Screen

- Replace icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Replace splash in `ios/App/App/Assets.xcassets/Splash.imageset/`

---

## 🤖 Android Specific Setup

### 1. Configure AndroidManifest.xml

Add permissions in `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Camera -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Location -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Internet -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Vibration -->
<uses-permission android:name="android.permission.VIBRATE" />

<!-- Features -->
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.location.gps" android:required="false" />
```

### 2. Configure Push Notifications (Firebase)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Add Android app with package name: `com.landwash.app`
4. Download `google-services.json`
5. Place it in `android/app/`
6. Update `android/build.gradle`:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

7. Update `android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'
```

### 3. Configure App Icon and Splash Screen

- Use [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/) to generate icons
- Replace in `android/app/src/main/res/`

---

## 🚀 Building for Production

### iOS (App Store)

```bash
# 1. Build your Angular app
npm run build -- --configuration production

# 2. Sync to iOS
npx cap sync ios

# 3. Open Xcode
npx cap open ios

# 4. In Xcode:
# - Select "Any iOS Device (arm64)" as target
# - Product → Archive
# - Distribute to App Store
```

### Android (Play Store)

```bash
# 1. Build your Angular app
npm run build -- --configuration production

# 2. Sync to Android
npx cap sync android

# 3. Open Android Studio
npx cap open android

# 4. In Android Studio:
# - Build → Generate Signed Bundle / APK
# - Choose "Android App Bundle"
# - Create or use keystore
# - Build release bundle
```

---

## 📱 Testing on Real Devices

### iOS

```bash
# Connect iPhone/iPad
npx cap run ios --target="YOUR_DEVICE_NAME"

# Or open in Xcode and run
npx cap open ios
```

### Android

```bash
# Connect Android device
npx cap run android

# Or open in Android Studio and run
npx cap open android
```

---

## 🔧 Development Workflow

```bash
# 1. Make changes to your Angular app
# 2. Build
npm run build

# 3. Sync changes (when you add new plugins or change config)
npx cap sync

# 4. For live reload during development:
npx cap run android --livereload --external
npx cap run ios --livereload --external
```

---

## 📚 Next Steps

After setup, you'll implement:

1. ✅ Native push notifications service
2. ✅ Camera plugin for photos
3. ✅ Enhanced geolocation
4. ✅ Local notifications for reminders
5. ✅ Biometric authentication
6. ✅ Share functionality

See the code files I'll create for implementation details.

---

## 🆘 Troubleshooting

### Build Errors

```bash
# Clean and rebuild
npx cap sync
cd ios && pod install && cd ..
npm run build
npx cap copy
```

### Plugin Not Working

```bash
# Reinstall plugins
npm install
npx cap sync
```

### iOS Pod Issues

```bash
cd ios/App
pod deintegrate
pod install
cd ../..
```

---

## 📖 Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Material Design](https://material.io/design)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Google Play Console](https://play.google.com/console)
