@echo off
title General Bilimoria's Canteen - APK Builder
color 0A

echo.
echo ===============================================
echo    General Bilimoria's Canteen - APK Builder
echo ===============================================
echo.
echo App Details:
echo - Name: General Bilimoria's Canteen
echo - Package: com.generalbilimoria.canteen
echo - Version: 1.0.2
echo - Credentials: Username: GBC, Password: GBC@123
echo.

echo [1/4] Checking prerequisites...
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

echo [2/4] Installing/updating dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo ✓ Dependencies installed
echo.

echo [3/4] Exporting app bundle...
call npx expo export --platform android
if %errorlevel% neq 0 (
    echo ERROR: Failed to export app bundle
    pause
    exit /b 1
)

echo ✓ App bundle exported successfully
echo.

echo [4/4] Building APK...
echo.
echo IMPORTANT: To complete the APK build, you have 3 options:
echo.
echo OPTION 1 - EAS Build (Recommended):
echo   1. Run: npm install -g eas-cli
echo   2. Run: eas login (create free account at https://expo.dev)
echo   3. Run: eas build --platform android --profile preview
echo   4. Download APK from EAS dashboard
echo.
echo OPTION 2 - Android Studio:
echo   1. Install Android Studio
echo   2. Open the 'android' folder in Android Studio
echo   3. Build ^> Generate Signed Bundle/APK
echo   4. Choose APK and use existing keystore
echo.
echo OPTION 3 - Manual Gradle (Advanced):
echo   1. Install Java JDK 11+
echo   2. cd android
echo   3. gradlew assembleRelease
echo   4. Find APK in app/build/outputs/apk/release/
echo.

echo ===============================================
echo           BUILD PREPARATION COMPLETE!
echo ===============================================
echo.
echo Your app is ready with:
echo ✓ Username: GBC
echo ✓ Password: GBC@123
echo ✓ Global dark/light theme
echo ✓ Settings ^& personalization
echo ✓ Complete restaurant management
echo ✓ Bundle exported to 'dist' folder
echo.
echo Choose one of the 3 options above to generate your APK.
echo.
pause
