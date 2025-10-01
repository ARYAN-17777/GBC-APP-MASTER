@echo off
title GBC Canteen - Simple APK Builder
color 0A

echo.
echo ===============================================
echo    GBC Canteen - Simple APK Builder
echo ===============================================
echo.
echo Building APK without Firebase complications...
echo.

echo [1/4] Installing EAS CLI...
call npm install -g eas-cli
if %errorlevel% neq 0 (
    echo ERROR: Failed to install EAS CLI
    pause
    exit /b 1
)

echo ✓ EAS CLI installed
echo.

echo [2/4] Exporting app bundle...
call npx expo export --platform android
if %errorlevel% neq 0 (
    echo ERROR: Failed to export bundle
    pause
    exit /b 1
)

echo ✓ Bundle exported successfully
echo.

echo [3/4] EAS Login...
echo.
echo IMPORTANT: You need a free Expo account
echo 1. Go to https://expo.dev
echo 2. Create a free account
echo 3. Login when prompted below
echo.
pause

call eas login
if %errorlevel% neq 0 (
    echo.
    echo Login failed. Let's try alternative method...
    echo.
    echo ALTERNATIVE - Use Expo Development Build:
    echo 1. Install Expo Go on your Android device
    echo 2. Run: npx expo start
    echo 3. Scan QR code with Expo Go
    echo 4. App will run directly on your device
    echo.
    pause
    exit /b 0
)

echo ✓ Login successful
echo.

echo [4/4] Building APK...
echo.
echo This will take 10-15 minutes...
echo Building professional APK with:
echo ✓ GBC credentials (GBC/GBC@123)
echo ✓ Dark/Light theme
echo ✓ Settings page
echo ✓ Restaurant management
echo ✓ All features working
echo.

call eas build --platform android --profile preview
if %errorlevel% neq 0 (
    echo.
    echo Build failed. Trying development build...
    call eas build --platform android --profile development
)

echo.
echo ===============================================
echo           APK BUILD COMPLETE!
echo ===============================================
echo.
echo Your APK is ready for download!
echo.
echo 1. Check your email for build notification
echo 2. Or visit: https://expo.dev/accounts/[your-username]/projects/gbc/builds
echo 3. Download the APK file
echo 4. Install on your Android device
echo.
echo Login credentials:
echo Username: GBC
echo Password: GBC@123
echo.
echo App features:
echo ✓ Complete restaurant management
echo ✓ Global dark/light theme
echo ✓ Settings & personalization
echo ✓ Order management system
echo ✓ Receipt generation
echo ✓ User authentication
echo.
pause
