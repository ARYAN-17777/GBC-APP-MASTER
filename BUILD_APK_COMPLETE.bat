@echo off
title GBC Canteen - Complete APK Builder
color 0A

echo.
echo ===============================================
echo     GBC Canteen - Complete APK Builder
echo ===============================================
echo.
echo This script will:
echo 1. Validate your project configuration
echo 2. Check system requirements
echo 3. Install dependencies if needed
echo 4. Build your APK using Expo EAS
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found
    echo    Make sure you're running this from the GBC-app-master directory
    echo.
    pause
    exit /b 1
)

echo ✅ Found package.json - proceeding with build process...
echo.

REM Check Node.js
echo 📋 Checking system requirements...
echo.

node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js: FOUND
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo    Version: %NODE_VERSION%
) else (
    echo ❌ Node.js: NOT FOUND
    echo.
    echo Please install Node.js first:
    echo 1. Go to https://nodejs.org/
    echo 2. Download and install Node.js LTS
    echo 3. Restart your computer
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)

REM Check npm
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ npm: FOUND
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo    Version: %NPM_VERSION%
) else (
    echo ❌ npm: NOT FOUND (should come with Node.js)
    pause
    exit /b 1
)

REM Check Java
java -version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Java: FOUND
) else (
    echo ❌ Java: NOT FOUND
    echo.
    echo Please install Java JDK:
    echo 1. Go to https://adoptium.net/
    echo 2. Download and install JDK 17
    echo 3. Set JAVA_HOME environment variable
    echo 4. Restart your computer
    echo 5. Run this script again
    echo.
    pause
    exit /b 1
)

REM Check EAS CLI
eas --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ EAS CLI: FOUND
    for /f "tokens=*" %%i in ('eas --version') do set EAS_VERSION=%%i
    echo    Version: %EAS_VERSION%
) else (
    echo ⚠️ EAS CLI: NOT FOUND - Installing now...
    echo.
    npm install -g @expo/eas-cli
    if %errorlevel% neq 0 (
        echo ❌ Failed to install EAS CLI
        pause
        exit /b 1
    )
    echo ✅ EAS CLI: INSTALLED
)

echo.
echo ===============================================
echo           VALIDATING PROJECT
echo ===============================================
echo.

REM Run project validation
echo 🔍 Running project validation...
node validate-project.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ Project validation failed!
    echo Please fix the errors above before continuing.
    pause
    exit /b 1
)

echo.
echo ===============================================
echo         INSTALLING DEPENDENCIES
echo ===============================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing project dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
) else (
    echo ✅ Dependencies already installed
)

echo.
echo ===============================================
echo              EXPO LOGIN
echo ===============================================
echo.

echo You need to login to Expo to build your APK.
echo.
echo If you don't have an account:
echo 1. Go to https://expo.dev
echo 2. Create a free account
echo 3. Verify your email
echo.
echo Press any key to login to Expo...
pause >nul

eas login
if %errorlevel% neq 0 (
    echo.
    echo ❌ Expo login failed
    echo Please check your credentials and try again
    pause
    exit /b 1
)

echo.
echo ✅ Expo login successful!

echo.
echo ===============================================
echo              BUILD OPTIONS
echo ===============================================
echo.
echo Choose build type:
echo 1. Preview Build (Recommended for testing)
echo 2. Production Build (For final release)
echo 3. Development Build (With debugging)
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    set BUILD_COMMAND=npm run build:preview
    set BUILD_TYPE=Preview
) else if "%choice%"=="2" (
    set BUILD_COMMAND=npm run build:prod
    set BUILD_TYPE=Production
) else if "%choice%"=="3" (
    set BUILD_COMMAND=npm run build:dev
    set BUILD_TYPE=Development
) else (
    echo Invalid choice. Using Preview build as default.
    set BUILD_COMMAND=npm run build:preview
    set BUILD_TYPE=Preview
)

echo.
echo ===============================================
echo            BUILDING APK (%BUILD_TYPE%)
echo ===============================================
echo.
echo 🚀 Starting %BUILD_TYPE% build...
echo.
echo This will:
echo ✅ Upload your project to Expo servers
echo ✅ Build APK in the cloud (10-15 minutes)
echo ✅ Send download link to your email
echo ✅ Make APK available at https://expo.dev/builds
echo.
echo Features in your APK:
echo ✅ Thermal receipt printing (Swift 2 Pro)
echo ✅ Auto-refresh every 2 seconds
echo ✅ Complete restaurant management
echo ✅ Real-time order updates
echo ✅ Dark/Light theme support
echo.
echo Press any key to start building...
pause >nul

echo.
echo 🔨 Building APK...
echo.

%BUILD_COMMAND%

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
    echo 5. Install and test your app!
    echo.
    echo App Details:
    echo 📱 Name: General Bilimoria's Canteen
    echo 📦 Package: com.generalbilimoria.canteen
    echo 🔢 Version: 2.0.0
    echo 🔑 Login: Username: GBC, Password: GBC@123
    echo.
    echo Your professional restaurant app is ready! 🎉
    echo.
    echo Press any key to open Expo builds page...
    pause >nul
    start https://expo.dev/builds
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
    echo 2. Check build logs at: https://expo.dev/builds
    echo.
    echo 3. Verify your project configuration:
    echo    node validate-project.js
    echo.
    echo 4. Try a different build profile
    echo.
)

echo.
echo Press any key to exit...
pause >nul
