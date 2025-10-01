@echo off
title GBC Canteen - Direct Android Deployment
color 0A

echo.
echo ===============================================
echo    GBC Canteen - Direct Android Deployment
echo ===============================================
echo.
echo This will deploy directly to your Android device!
echo.
echo Make sure:
echo - Your Android device is connected via USB
echo - USB Debugging is enabled
echo - Developer options are enabled
echo.

echo [1/5] Checking prerequisites...
where adb >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing ADB...
    call npm install -g @expo/cli
)

echo ✓ Prerequisites ready
echo.

echo [2/5] Checking connected devices...
call adb devices
echo.
echo If you see your device listed above, press any key to continue...
pause

echo [3/5] Starting Expo development server...
start "Expo Server" cmd /k "npx expo start --android"
echo.
echo ✓ Expo server starting...
echo.

echo [4/5] Building and installing on device...
echo.
echo The Expo app will now:
echo 1. Build the app bundle
echo 2. Install on your connected Android device
echo 3. Launch the app automatically
echo.

timeout /t 5 /nobreak >nul

echo [5/5] Opening on device...
call npx expo run:android --device
if %errorlevel% neq 0 (
    echo.
    echo Alternative method - QR Code:
    echo 1. Install Expo Go from Play Store
    echo 2. Scan the QR code that appears
    echo 3. App will load directly on your device
)

echo.
echo ===============================================
echo           DEPLOYMENT COMPLETE!
echo ===============================================
echo.
echo Your GBC Canteen app is now running on your Android device!
echo.
echo Login credentials:
echo Username: GBC
echo Password: GBC@123
echo.
echo Features available:
echo ✓ Restaurant management system
echo ✓ Dark/Light theme switching
echo ✓ Settings & personalization
echo ✓ Order management
echo ✓ Receipt generation
echo.
pause
