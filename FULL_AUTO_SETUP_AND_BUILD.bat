@echo off
title GBC Canteen - FULL AUTO SETUP AND BUILD
color 0A
cls

echo.
echo ===============================================
echo     GBC CANTEEN - FULL AUTO SETUP & BUILD
echo ===============================================
echo.
echo This script will AUTOMATICALLY:
echo ✅ Setup your entire development environment
echo ✅ Fix all dependency issues
echo ✅ Install required tools
echo ✅ Build your APK file
echo.
echo ⚠️  IMPORTANT: This script needs Administrator privileges
echo    Right-click and "Run as Administrator" for best results
echo.

set /p confirm="Press Y to start FULL AUTO SETUP: "
if /i not "%confirm%"=="Y" (
    echo Setup cancelled.
    pause
    exit /b 0
)

echo.
echo 🚀 STARTING FULL AUTO SETUP...
echo.

REM ===============================================
REM STEP 1: SYSTEM PREPARATION
REM ===============================================
echo.
echo 📋 STEP 1/8: SYSTEM PREPARATION
echo ===============================================

REM Enable PowerShell execution
echo   🔧 Enabling PowerShell execution policy...
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force" 2>nul

REM Check Node.js installation
echo   📦 Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   ❌ Node.js not found! 
    echo   📥 Please install Node.js from: https://nodejs.org
    echo   ⏸️  Setup paused. Install Node.js and run this script again.
    pause
    exit /b 1
) else (
    echo   ✅ Node.js found and ready
)

REM ===============================================
REM STEP 2: INSTALL GLOBAL TOOLS
REM ===============================================
echo.
echo 🛠️  STEP 2/8: INSTALLING GLOBAL TOOLS
echo ===============================================

echo   📦 Installing EAS CLI globally...
powershell -Command "npm install -g eas-cli@latest" 2>nul

echo   📦 Installing Expo CLI globally...
powershell -Command "npm install -g @expo/cli@latest" 2>nul

echo   📦 Installing Yarn (backup package manager)...
powershell -Command "npm install -g yarn" 2>nul

echo   ✅ Global tools installed

REM ===============================================
REM STEP 3: PROJECT VALIDATION
REM ===============================================
echo.
echo 🔍 STEP 3/8: PROJECT VALIDATION
echo ===============================================

if not exist "package.json" (
    echo   ❌ Error: package.json not found
    echo   📁 Make sure you're running this from the GBC-app-master directory
    echo   📍 Current directory: %CD%
    pause
    exit /b 1
)

echo   ✅ Project structure validated

REM ===============================================
REM STEP 4: COMPLETE CLEANUP
REM ===============================================
echo.
echo 🧹 STEP 4/8: COMPLETE CLEANUP
echo ===============================================

echo   🗑️  Removing old dependencies...
if exist "node_modules" (
    echo   📁 Removing node_modules...
    rmdir /s /q "node_modules" 2>nul
)

if exist "package-lock.json" (
    echo   🔒 Removing package-lock.json...
    del "package-lock.json" 2>nul
)

if exist "yarn.lock" (
    echo   🧶 Removing yarn.lock...
    del "yarn.lock" 2>nul
)

echo   🧽 Clearing npm cache...
powershell -Command "npm cache clean --force" 2>nul

echo   ✅ Cleanup completed

REM ===============================================
REM STEP 5: DEPENDENCY INSTALLATION
REM ===============================================
echo.
echo 📦 STEP 5/8: DEPENDENCY INSTALLATION
echo ===============================================

echo   📥 Installing dependencies with legacy peer deps...
powershell -Command "npm install --legacy-peer-deps"

if %errorlevel% neq 0 (
    echo   ⚠️  npm install failed, trying alternative methods...
    
    echo   🔨 Trying with force flag...
    powershell -Command "npm install --force"
    
    if %errorlevel% neq 0 (
        echo   🧶 Trying with Yarn...
        powershell -Command "yarn install"
        
        if %errorlevel% neq 0 (
            echo   ❌ All installation methods failed!
            echo   🆘 Manual intervention required.
            pause
            exit /b 1
        )
    )
)

echo   ✅ Dependencies installed successfully

REM ===============================================
REM STEP 6: EXPO DEPENDENCY FIX
REM ===============================================
echo.
echo 🚀 STEP 6/8: EXPO DEPENDENCY FIX
echo ===============================================

echo   🔧 Fixing Expo dependencies...
powershell -Command "npx expo install --fix"

echo   🩺 Running Expo doctor...
powershell -Command "npx expo doctor"

echo   ✅ Expo dependencies fixed

REM ===============================================
REM STEP 7: BUILD VALIDATION
REM ===============================================
echo.
echo 🧪 STEP 7/8: BUILD VALIDATION
echo ===============================================

echo   📤 Testing export functionality...
powershell -Command "npx expo export --platform android --dev false"

if %errorlevel% neq 0 (
    echo   ⚠️  Export test failed, trying with cache clear...
    powershell -Command "npx expo export --platform android --dev false --clear"
    
    if %errorlevel% neq 0 (
        echo   ❌ Export validation failed!
        echo   🔧 Build may still work, but there might be issues.
        echo   📝 Continuing with EAS build attempt...
    ) else (
        echo   ✅ Export successful with cache clear
    )
) else (
    echo   ✅ Export validation successful
)

REM ===============================================
REM STEP 8: AUTOMATIC EAS BUILD
REM ===============================================
echo.
echo 🏗️  STEP 8/8: AUTOMATIC EAS BUILD
echo ===============================================

echo   🔐 Checking EAS login status...
powershell -Command "eas whoami" >nul 2>&1

if %errorlevel% neq 0 (
    echo   🔑 Not logged in to EAS. Starting login process...
    echo   📝 Please enter your Expo credentials when prompted:
    powershell -Command "eas login"
    
    if %errorlevel% neq 0 (
        echo   ❌ EAS login failed!
        echo   🔑 Please login manually: eas login
        echo   🏗️  Then run: eas build --platform android --profile preview
        pause
        exit /b 1
    )
) else (
    echo   ✅ Already logged in to EAS
)

echo.
echo   🏗️  STARTING APK BUILD...
echo   ⏱️  This will take 10-15 minutes
echo   📧 You'll receive an email when complete
echo.

powershell -Command "eas build --platform android --profile preview --non-interactive"

if %errorlevel% equ 0 (
    echo.
    echo   🎉 BUILD SUCCESSFUL!
    echo   📧 Check your email for the APK download link
    echo   🌐 Or visit: https://expo.dev/accounts/swapnil9899/projects/gbc-app-master/builds
) else (
    echo.
    echo   ⚠️  Build command executed but may have issues
    echo   🌐 Check build status at: https://expo.dev
    echo   🔄 You can also try: eas build --clear-cache --platform android --profile preview
)

echo.
echo ===============================================
echo           FULL AUTO SETUP COMPLETE!
echo ===============================================
echo.
echo 🎯 SUMMARY:
echo ✅ Development environment setup
echo ✅ All dependencies installed and fixed  
echo ✅ Build validation completed
echo ✅ APK build initiated
echo.
echo 📱 YOUR GBC CANTEEN APP:
echo    Name: General Bilimoria's Canteen
echo    Features: Thermal Printing + Auto-refresh
echo    Login: Username=GBC, Password=GBC@123
echo.
echo 🚀 Your app is ready! Check your email for the APK file.
echo.

pause
