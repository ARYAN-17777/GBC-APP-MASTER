# 📱 General Bilimoria's Canteen - APK Build Guide

## 🎯 **COMPLETE APK BUILD INSTRUCTIONS**

### **Method 1: Using EAS Build (Recommended)**

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```
   - Create a free Expo account at https://expo.dev
   - Use your credentials to login

3. **Configure Build:**
   ```bash
   eas build:configure
   ```

4. **Build APK:**
   ```bash
   eas build --platform android --profile preview
   ```

### **Method 2: Local Build (Alternative)**

1. **Prerequisites:**
   - Android Studio installed
   - Java JDK 11 or higher
   - Android SDK configured

2. **Export App Bundle:**
   ```bash
   npx expo export --platform android
   ```

3. **Build APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

4. **Find APK:**
   - Location: `android/app/build/outputs/apk/release/app-release.apk`

### **Method 3: Using Expo Development Build**

1. **Install Expo Dev Client:**
   ```bash
   npx expo install expo-dev-client
   ```

2. **Build Development APK:**
   ```bash
   eas build --platform android --profile development
   ```

## 🔧 **APP CONFIGURATION**

### **App Details:**
- **Name:** General Bilimoria's Canteen
- **Package:** com.generalbilimoria.canteen
- **Version:** 1.0.2
- **Build:** 3

### **Features Included:**
- ✅ **Complete Restaurant Management System**
- ✅ **Order Management Dashboard**
- ✅ **Real-time Order Tracking**
- ✅ **Receipt Generation & Printing**
- ✅ **Dark/Light Theme Support**
- ✅ **Settings & Personalization**
- ✅ **User Authentication**
- ✅ **Profile Management**
- ✅ **Notification System**
- ✅ **Audio Alerts**

### **Responsive Design:**
- ✅ **Mobile Optimized**
- ✅ **Tablet Support**
- ✅ **Different Screen Sizes**
- ✅ **Portrait/Landscape**

## 📦 **EXPORTED BUNDLE READY**

The app has been successfully exported and is ready for building:
- **Bundle Location:** `dist/` folder
- **Platform:** Android
- **Size:** ~3MB bundle
- **Assets:** 35 files included
- **Fonts:** Outfit font family (9 weights)

## 🚀 **QUICK BUILD COMMANDS**

```bash
# Method 1: EAS Build (Cloud)
eas build --platform android --profile preview

# Method 2: Local Build
npx expo export --platform android
cd android && ./gradlew assembleRelease

# Method 3: Development Build
eas build --platform android --profile development
```

## 📱 **APK SPECIFICATIONS**

- **Min SDK:** 24 (Android 7.0)
- **Target SDK:** 34 (Android 14)
- **Architecture:** arm64-v8a, armeabi-v7a, x86, x86_64
- **Signing:** Release signed with keystore
- **Hermes:** Enabled for better performance
- **New Architecture:** Enabled

## 🔐 **SIGNING CONFIGURATION**

The app is configured with release signing:
- **Keystore:** `android/app/my-key.keystore`
- **Alias:** my-key-alias
- **Password:** Configured in gradle.properties

## 📋 **TROUBLESHOOTING**

### **Common Issues:**

1. **Gradle Build Fails:**
   - Ensure Java JDK 11+ is installed
   - Clear gradle cache: `./gradlew clean`

2. **EAS Login Issues:**
   - Create account at https://expo.dev
   - Verify email before building

3. **Missing Dependencies:**
   - Run: `npx expo install --fix`

## 🎉 **FINAL APK FEATURES**

Your APK will include:
- **Complete Restaurant Management System**
- **Global Dark/Light Theme**
- **Settings & Personalization**
- **Order Management**
- **Receipt Generation**
- **User Authentication**
- **Profile Management**
- **Responsive Design**
- **Professional UI/UX**

## 📞 **SUPPORT**

If you encounter any issues:
1. Check the troubleshooting section
2. Ensure all prerequisites are installed
3. Try the EAS Build method (recommended)
4. The exported bundle is ready in the `dist/` folder
