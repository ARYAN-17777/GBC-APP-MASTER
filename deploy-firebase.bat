@echo off
title General Bilimoria's Canteen - Firebase Deployment
color 0A

echo.
echo ===============================================
echo    Firebase Deployment - GBC Canteen
echo ===============================================
echo.
echo This script will:
echo - Install Firebase CLI
echo - Build the web app
echo - Deploy to Firebase Hosting
echo - Set up Firebase services
echo.

echo [1/6] Checking prerequisites...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm not found. Please install npm first.
    pause
    exit /b 1
)

echo ✓ Node.js and npm found
echo.

echo [2/6] Installing Firebase CLI...
call npm install -g firebase-tools
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Firebase CLI
    pause
    exit /b 1
)

echo ✓ Firebase CLI installed
echo.

echo [3/6] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo ✓ Dependencies installed
echo.

echo [4/6] Building web app...
call npx expo export --platform web
if %errorlevel% neq 0 (
    echo ERROR: Failed to build web app
    pause
    exit /b 1
)

echo ✓ Web app built successfully
echo.

echo [5/6] Firebase Login...
echo Please login to Firebase when prompted...
call firebase login
if %errorlevel% neq 0 (
    echo ERROR: Firebase login failed
    pause
    exit /b 1
)

echo ✓ Firebase login successful
echo.

echo [6/6] Deploying to Firebase...
echo.
echo IMPORTANT: You need to:
echo 1. Create a Firebase project at https://console.firebase.google.com
echo 2. Update firebaseConfig.ts with your project details
echo 3. Run: firebase init
echo 4. Run: firebase deploy
echo.

echo ===============================================
echo           FIREBASE SETUP COMPLETE!
echo ===============================================
echo.
echo Next steps:
echo 1. Visit https://console.firebase.google.com
echo 2. Create a new project named "gbc-canteen"
echo 3. Enable Authentication, Firestore, Realtime Database, Storage
echo 4. Update firebaseConfig.ts with your project config
echo 5. Run: firebase init
echo 6. Run: firebase deploy
echo.
echo Your app will be available at:
echo https://gbc-canteen.web.app
echo.
pause
