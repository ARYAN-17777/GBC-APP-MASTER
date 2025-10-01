@echo off
title GBC Canteen - Run on Android Device
color 0A

echo.
echo ===============================================
echo    GBC Canteen - Run on Android Device
echo ===============================================
echo.
echo This will run the app directly on your connected Android device!
echo.

echo Prerequisites:
echo ✓ Android device connected via USB
echo ✓ USB Debugging enabled
echo ✓ Developer options enabled
echo.

echo [1/3] Checking device connection...
call adb devices
echo.
echo If your device is listed above, press any key to continue...
echo If not, please:
echo 1. Enable Developer Options on your Android device
echo 2. Enable USB Debugging
echo 3. Connect via USB and allow debugging
echo.
pause

echo [2/3] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo ✓ Dependencies installed
echo.

echo [3/3] Building and running on device...
echo.
echo This will:
echo 1. Build the app
echo 2. Install it on your connected Android device
echo 3. Launch the app automatically
echo.

call npx expo run:android --device
if %errorlevel% neq 0 (
    echo.
    echo Direct installation failed. Trying alternative method...
    echo.
    echo ALTERNATIVE METHOD:
    echo 1. Install "Expo Go" from Google Play Store
    echo 2. Run the command below in a new terminal:
    echo    npx expo start
    echo 3. Scan the QR code with Expo Go
    echo 4. Your app will load directly!
    echo.
    pause
    
    echo Starting Expo development server...
    call npx expo start
)

echo.
echo ===============================================
echo           APP RUNNING ON YOUR DEVICE!
echo ===============================================
echo.
echo Your GBC Canteen app is now running!
echo.
echo Login with:
echo Username: GBC
echo Password: GBC@123
echo.
echo Test all features:
echo ✓ Login/logout
echo ✓ Dashboard navigation
echo ✓ Dark/light theme toggle (Settings)
echo ✓ Profile management
echo ✓ Order management
echo ✓ Settings page
echo.
pause
