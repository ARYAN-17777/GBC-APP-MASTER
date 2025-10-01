# 🔧 GBC Canteen - Build Error Fix Guide

## 📋 Overview
This guide provides a complete step-by-step solution to fix the **"npm ci exited with non-zero code: 1"** error that occurs during Expo EAS builds.

### 🎯 What This Fixes
- ❌ `npm ci exited with non-zero code: 1`
- ❌ `npx expo export:embed --eager --platform android --dev false exited with non-zero code: 1`
- ❌ Dependency conflicts with React 19.x
- ❌ TypeScript module resolution issues

---

## 🚀 Prerequisites

Before starting, ensure you have:

| Requirement | Download Link | Version |
|-------------|---------------|---------|
| **Node.js** | [nodejs.org](https://nodejs.org) | 18.x or 20.x |
| **Git** | [git-scm.com](https://git-scm.com) | Latest |
| **Code Editor** | [VS Code](https://code.visualstudio.com) | Any |

---

## 📝 Step-by-Step Solution

### Step 1: Environment Setup

```bash
# Open Command Prompt as Administrator

# Install EAS CLI globally
npm install -g eas-cli@latest

# Install Expo CLI globally  
npm install -g @expo/cli@latest

# Verify installations
eas --version
expo --version
```

### Step 2: Project Setup

```bash
# Option A: Clone from Git
git clone https://github.com/yourusername/gbc-app-master.git
cd gbc-app-master

# Option B: Download ZIP and extract
# Then navigate to folder
cd path\to\gbc-app-master
```

### Step 3: Fix Package.json (Critical)

Open `package.json` and make these **exact changes**:

#### 🔄 React Version Downgrade
**Find:**
```json
"react": "19.0.0",
"react-dom": "19.0.0", 
"react-native": "0.79.5",
```

**Replace with:**
```json
"react": "18.2.0",
"react-dom": "18.2.0",
"react-native": "0.74.5",
```

#### 🔄 TypeScript Types Fix
**Find:**
```json
"@types/react": "~19.0.10",
"react-test-renderer": "19.0.0",
```

**Replace with:**
```json
"@types/react": "~18.2.79", 
"react-test-renderer": "18.2.0",
```

#### 🔄 Overrides Section
**Find:**
```json
"overrides": {
  "react": "19.0.0",
  "react-dom": "19.0.0", 
  "@types/react": "~19.0.10"
}
```

**Replace with:**
```json
"overrides": {
  "react": "18.2.0",
  "react-dom": "18.2.0", 
  "@types/react": "~18.2.79"
}
```

### Step 4: Fix TypeScript Configuration

Open `tsconfig.json` and change:

**Find:**
```json
"moduleResolution": "bundler"
```

**Replace with:**
```json
"moduleResolution": "node"
```

### Step 5: Clean Dependency Installation

```bash
# Delete old files
del package-lock.json
rmdir /s node_modules

# Clean npm cache
npm cache clean --force

# Install with legacy peer deps (prevents conflicts)
npm install --legacy-peer-deps

# Fix Expo dependencies
npx expo install --fix
```

### Step 6: Verify Fix

```bash
# Check for issues
npx expo doctor

# Test the exact command that was failing
npx expo export --platform android --dev false
```

✅ **If this succeeds, your fix worked!**

### Step 7: Build APK

```bash
# Login to Expo account
eas login

# Build APK
eas build --platform android --profile preview
```

---

## 🛠️ Alternative Quick Fix Script

Create `fix-build.bat`:

```batch
@echo off
title GBC Canteen - Quick Fix
echo Fixing build error...

rem Clean everything
del package-lock.json 2>nul
rmdir /s /q node_modules 2>nul
npm cache clean --force

rem Install with legacy peer deps
npm install --legacy-peer-deps

rem Fix Expo dependencies  
npx expo install --fix

rem Test build
npx expo export --platform android --dev false

if %errorlevel% equ 0 (
    echo ✅ Fix successful! Ready to build.
) else (
    echo ❌ Still having issues. Try manual steps.
)

pause
```

**Usage:** Double-click the file to run.

---

## 🚨 Troubleshooting

### Issue: npm install fails
```bash
# Try with force flag
npm install --force

# Or use Yarn
npm install -g yarn
yarn install
```

### Issue: PowerShell execution policy
```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

### Issue: EAS build still fails
```bash
# Clear EAS cache
eas build --clear-cache --platform android --profile preview

# Try production profile
eas build --platform android --profile production
```

---

## ⏱️ Expected Timeline

| Step | Duration | Description |
|------|----------|-------------|
| 1-4 | 5 min | Setup and config fixes |
| 5 | 3-5 min | Dependency installation |
| 6 | 2 min | Testing |
| 7 | 10-15 min | EAS build |
| **Total** | **~25 min** | Complete process |

---

## ✅ Success Indicators

1. ✅ `npm install` completes without errors
2. ✅ `npx expo doctor` shows no critical issues  
3. ✅ `npx expo export --platform android --dev false` succeeds
4. ✅ EAS build reaches 100% completion
5. ✅ Email received with APK download link

---

## 📱 Final Result

### App Details
- **Name:** General Bilimoria's Canteen
- **Package:** com.swapnil8899.gbcappmaster
- **Version:** 2.0.0
- **Size:** ~50-100MB

### Features Included
- 🖨️ **Thermal Printer Support** (Swift 2 Pro)
- 🔄 **Auto-refresh** every 2 seconds
- 🍽️ **Complete Restaurant Management**
- 🔐 **Secure Authentication**

### Login Credentials
- **Username:** `GBC`
- **Password:** `GBC@123`

---

## 🎉 Conclusion

This guide resolves the React 19.x compatibility issues that cause the `npm ci exited with non-zero code: 1` error. The fix works by:

1. **Downgrading React** to stable 18.2.0
2. **Fixing dependency conflicts** with legacy peer deps
3. **Correcting TypeScript** module resolution
4. **Ensuring Expo compatibility** with SDK 53

**Result:** Your GBC Canteen app will build successfully on any PC! 🚀

---

*Last updated: December 2024*  
*Compatible with: Expo SDK 53, React 18.2.0, Node.js 18-20*
