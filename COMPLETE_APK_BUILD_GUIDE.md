# 🚀 GBC Canteen - Complete APK Build Guide

## 📋 Project Status: ✅ READY FOR DEPLOYMENT

**✅ All Features Implemented:**
- ✅ Thermal Receipt Printing (Swift 2 Pro support)
- ✅ Auto-refresh every 2 seconds for new orders
- ✅ Complete restaurant management system
- ✅ Real-time order updates
- ✅ Dark/Light theme support
- ✅ User authentication with Supabase
- ✅ Production-ready configuration

---

## 🎯 STEP-BY-STEP APK BUILDING INSTRUCTIONS

### 📦 STEP 1: System Requirements

**Required Software:**
1. **Node.js 20.x or higher** - JavaScript runtime
2. **Java JDK 17** - Android build tools
3. **EAS CLI** - Expo build service
4. **Git** (optional) - Version control

---

### 🛠️ STEP 2: Install Development Tools

#### **A. Install Node.js (5 minutes)**

1. **Download Node.js:**
   - Go to: https://nodejs.org/
   - Click **"Download Node.js (LTS)"** (green button)
   - Choose the version for your operating system

2. **Install Node.js:**
   - Run the downloaded installer
   - ✅ **IMPORTANT:** Check "Add to PATH" during installation
   - ✅ Check "Install additional tools" if prompted
   - Complete the installation

3. **Verify Installation:**
   ```cmd
   node --version
   npm --version
   ```
   Should show versions like `v20.x.x` and `10.x.x`

#### **B. Install Java JDK (5 minutes)**

1. **Download Java JDK:**
   - Go to: https://adoptium.net/
   - Select: **JDK 17 (LTS)** for your OS
   - Download the installer

2. **Install Java JDK:**
   - Run the installer with default settings
   - Note the installation path (usually `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot\`)

3. **Set Environment Variables (Windows):**
   - Press `Win + R`, type `sysdm.cpl`, press Enter
   - Click "Advanced" → "Environment Variables"
   - Add new System Variable:
     - Name: `JAVA_HOME`
     - Value: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot\`
   - Edit "Path" variable, add: `%JAVA_HOME%\bin`
   - Click OK to save

4. **Verify Installation:**
   ```cmd
   java -version
   javac -version
   ```

#### **C. Install EAS CLI (1 minute)**

**After Node.js is installed:**
```cmd
npm install -g @expo/eas-cli
```

**Verify Installation:**
```cmd
eas --version
```

---

### 📁 STEP 3: Prepare Project Files

#### **Option A: Transfer Existing Project**

1. **Copy the entire project folder** to your build machine
2. **Navigate to project directory:**
   ```cmd
   cd path\to\GBC-app-master
   ```

#### **Option B: Download from Repository**

If using Git:
```cmd
git clone [your-repository-url]
cd GBC-app-master
```

---

### 📦 STEP 4: Install Project Dependencies

```cmd
# Navigate to project root
cd GBC-app-master

# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

**Expected output:** List of installed packages including:
- expo ~53.0.0
- react-native-printer-imin ^1.8.0
- @supabase/supabase-js ^2.57.0
- And many others...

---

### 🔧 STEP 5: Run Pre-Build Checks

```cmd
# Run comprehensive pre-build validation
npm run pre-build-check
```

**Expected output:**
```
✅ Project Configuration: Valid
✅ Dependencies: All installed
✅ Assets: All present
✅ Environment: Ready for build
✅ Thermal Printer: Configured
✅ Auto-refresh: Enabled
🎉 Project is ready for APK build!
```

---

### 🚀 STEP 6: Build APK with Expo EAS

#### **A. Login to Expo**

```cmd
eas login
```

**If you don't have an Expo account:**
1. Go to https://expo.dev
2. Create a free account
3. Verify your email
4. Use those credentials to login

#### **B. Build APK (Choose One)**

**For Testing (Recommended first):**
```cmd
npm run build:preview
```

**For Production:**
```cmd
npm run build:prod
```

**For Development (with debugging):**
```cmd
npm run build:dev
```

#### **C. Monitor Build Progress**

**The build process will:**
1. ✅ Upload your project to Expo servers
2. ✅ Install dependencies in cloud environment
3. ✅ Compile Android APK (10-15 minutes)
4. ✅ Send email notification when complete
5. ✅ Provide download link

**Build Status:**
- Check: https://expo.dev/builds
- Or wait for email notification

---

### 📱 STEP 7: Download and Install APK

#### **A. Download APK**

1. **Check your email** for build completion notification
2. **Or visit:** https://expo.dev/builds
3. **Click on your latest build**
4. **Download the APK file** (~50-100MB)

#### **B. Install on Android Device**

1. **Transfer APK** to Android device (USB, email, cloud storage)
2. **Enable "Install from unknown sources"** in Android Settings
3. **Tap the APK file** to install
4. **Allow installation** when prompted

---

### 🎉 STEP 8: Test Your App

#### **A. Launch App**

1. **Open "General Bilimoria's Canteen"** from app drawer
2. **Login with credentials:**
   - Username: `GBC`
   - Password: `GBC@123`

#### **B. Test Core Features**

1. **✅ Order Management:** Create, view, update orders
2. **✅ Auto-refresh:** Orders update every 2 seconds
3. **✅ Thermal Printing:** Connect Swift 2 Pro via Bluetooth
4. **✅ Theme Toggle:** Switch between light/dark themes
5. **✅ Real-time Updates:** New orders appear automatically

#### **C. Test Thermal Printing**

1. **Connect Swift 2 Pro printer** via Bluetooth
2. **Create a test order**
3. **Print receipt** - should show clear black text
4. **Verify:** No blank receipts, proper formatting

---

## 🔧 Troubleshooting Common Issues

### **Build Errors**

**Error: "Node.js not found"**
```cmd
# Solution: Restart terminal after Node.js installation
# Or add Node.js to PATH manually
```

**Error: "Java not found"**
```cmd
# Solution: Set JAVA_HOME environment variable
# Restart terminal after setting
```

**Error: "EAS CLI not found"**
```cmd
# Solution: Install EAS CLI globally
npm install -g @expo/eas-cli
```

### **Build Failures**

**Error: "Build failed with exit code 1"**
```cmd
# Solution: Clear cache and retry
eas build --clear-cache --platform android --profile preview
```

**Error: "Dependencies not found"**
```cmd
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### **APK Installation Issues**

**Error: "App not installed"**
- Enable "Install from unknown sources"
- Check available storage space
- Try installing via ADB

**Error: "App crashes on startup"**
- Check Android version compatibility (Android 6.0+)
- Clear app data and restart
- Check device permissions

---

## 📊 Expected Build Results

### **APK Details:**
- **File Size:** ~50-100MB
- **Package Name:** com.generalbilimoria.canteen
- **Version:** 2.0.0
- **Min Android:** 6.0 (API 23)
- **Target Android:** 14 (API 34)

### **App Features:**
- **Restaurant Management:** Complete POS system
- **Thermal Printing:** Swift 2 Pro support with ESC/POS
- **Real-time Updates:** 2-second auto-refresh
- **User Authentication:** Secure login system
- **Theme Support:** Light/Dark mode toggle
- **Offline Capability:** Local data caching

---

## ⏱️ Time Estimates

- **Setup (first time):** 15-20 minutes
- **Build Process:** 10-15 minutes
- **APK Download:** 2-5 minutes
- **Installation & Testing:** 5-10 minutes
- **Total Time:** ~30-50 minutes

---

## 🎯 Success Indicators

### **✅ Setup Complete When:**
```cmd
node --version    # Shows v20.x.x
npm --version     # Shows 10.x.x
java -version     # Shows Java 17.x.x
eas --version     # Shows EAS CLI version
```

### **✅ Build Complete When:**
- Email received with APK download link
- Build shows "FINISHED" at expo.dev/builds
- APK file downloaded successfully
- App installs and runs on Android device

### **✅ App Working When:**
- Login successful with GBC/GBC@123
- Orders display and update every 2 seconds
- Thermal printer connects and prints receipts
- All features respond correctly

---

## 📞 Final Notes

**Your GBC Canteen app is production-ready!**

This guide provides everything needed to build and deploy your professional restaurant management app with thermal printing capabilities. The app includes all requested features and is optimized for real-world restaurant operations.

**Support:** If you encounter any issues, refer to the troubleshooting section or check the Expo documentation at https://docs.expo.dev/

🎉 **Congratulations! You now have a complete restaurant management system ready for production use!**
