@echo off
title GBC Canteen - APK Builder
color 0A

echo.
echo ===============================================
echo        GBC Canteen - APK Builder
echo ===============================================
echo.
echo Checking system requirements...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js: FOUND
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo    Version: %NODE_VERSION%
) else (
    echo ❌ Node.js: NOT FOUND
    set MISSING_DEPS=1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ npm: FOUND
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo    Version: %NPM_VERSION%
) else (
    echo ❌ npm: NOT FOUND
    set MISSING_DEPS=1
)

REM Check if Java is installed
java -version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Java: FOUND
) else (
    echo ❌ Java: NOT FOUND
    set MISSING_DEPS=1
)

REM Check if EAS CLI is installed
eas --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ EAS CLI: FOUND
    for /f "tokens=*" %%i in ('eas --version') do set EAS_VERSION=%%i
    echo    Version: %EAS_VERSION%
) else (
    echo ❌ EAS CLI: NOT FOUND
    set MISSING_DEPS=1
)

echo.

if defined MISSING_DEPS (
    echo ===============================================
    echo          MISSING DEPENDENCIES DETECTED
    echo ===============================================
    echo.
    echo Some required tools are missing. You need to install:
    echo.
    if not defined NODE_VERSION (
        echo 📦 Node.js - Download from: https://nodejs.org/
        echo    Choose the LTS version and run the installer
    )
    if not defined NPM_VERSION (
        echo 📦 npm - Comes with Node.js installation
    )
    java -version >nul 2>&1
    if %errorlevel% neq 0 (
        echo 📦 Java JDK - Download from: https://adoptium.net/
        echo    Choose JDK 17 and set JAVA_HOME environment variable
    )
    eas --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo 📦 EAS CLI - Install with: npm install -g @expo/eas-cli
        echo    ^(After installing Node.js^)
    )
    echo.
    echo ===============================================
    echo              INSTALLATION GUIDE
    echo ===============================================
    echo.
    echo 📋 Step-by-step instructions are available in:
    echo    MANUAL_BUILD_INSTRUCTIONS.md
    echo.
    echo 🚀 Quick setup:
    echo 1. Install Node.js from https://nodejs.org/
    echo 2. Install Java JDK from https://adoptium.net/
    echo 3. Restart your computer
    echo 4. Run: npm install -g @expo/eas-cli
    echo 5. Run this script again
    echo.
    echo Press any key to open the installation guide...
    pause >nul
    start MANUAL_BUILD_INSTRUCTIONS.md
    exit /b 1
)

echo ===============================================
echo           ALL DEPENDENCIES FOUND!
echo ===============================================
echo.
echo 🎉 Your system is ready to build the APK!
echo.
echo Starting APK build process...
echo.

REM Navigate to project directory
cd /d "%~dp0"

REM Check if eas.json exists
if not exist "eas.json" (
    echo ❌ Error: eas.json not found
    echo    Make sure you're in the correct project directory
    pause
    exit /b 1
)

echo ✅ Project configuration found
echo.

echo ===============================================
echo              EXPO EAS LOGIN
echo ===============================================
echo.
echo You need to login to Expo to build your APK.
echo.
echo If you don't have an account:
echo 1. Go to https://expo.dev
echo 2. Create a free account
echo 3. Verify your email
echo.
echo Press any key to login...
pause >nul

eas login
if %errorlevel% neq 0 (
    echo.
    echo ❌ Login failed. Please check your credentials.
    echo.
    echo Troubleshooting:
    echo 1. Make sure you have an Expo account at https://expo.dev
    echo 2. Verify your email address
    echo 3. Check your internet connection
    echo 4. Try running: eas login
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Login successful!
echo.

echo ===============================================
echo              BUILDING APK
echo ===============================================
echo.
echo Building your GBC Canteen APK...
echo.
echo This will:
echo ✅ Upload your project to Expo servers
echo ✅ Build APK in the cloud (10-15 minutes)
echo ✅ Send download link to your email
echo ✅ Make APK available at https://expo.dev/builds
echo.
echo Features included in your APK:
echo ✅ Thermal receipt printing (Swift 2 Pro support)
echo ✅ Auto-refresh every 2 seconds for new orders
echo ✅ Complete restaurant management system
echo ✅ Dark/Light theme support
echo ✅ Real-time order updates
echo.
echo Press any key to start building...
pause >nul

echo.
echo 🚀 Starting build...
echo.

eas build --platform android --profile preview

if %errorlevel% equ 0 (
    echo.
    echo ===============================================
    echo              BUILD SUCCESSFUL!
    echo ===============================================
    echo.
    echo 🎉 Your APK has been built successfully!
    echo.
    echo Next steps:
    echo 1. Check your email for the download link
    echo 2. Or visit: https://expo.dev/builds
    echo 3. Download the APK file
    echo 4. Transfer to your Android device
    echo 5. Install and enjoy your restaurant app!
    echo.
    echo App Details:
    echo 📱 Name: General Bilimoria's Canteen
    echo 📦 Package: com.generalbilimoria.canteen
    echo 🔢 Version: 2.0.0
    echo 🔑 Login: Username: GBC, Password: GBC@123
    echo.
    echo Your professional restaurant management app is ready! 🎉
    echo.
) else (
    echo.
    echo ===============================================
    echo               BUILD FAILED
    echo ===============================================
    echo.
    echo ❌ The build failed. Common solutions:
    echo.
    echo 1. Clear cache and retry:
    echo    eas build --clear-cache --platform android --profile preview
    echo.
    echo 2. Try development build:
    echo    eas build --platform android --profile development
    echo.
    echo 3. Check build logs at: https://expo.dev/builds
    echo.
    echo 4. Verify your project configuration
    echo.
)

echo.
echo Press any key to exit...
pause >nul
