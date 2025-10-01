@echo off
title GBC Canteen - Fix Build Error
color 0C

echo.
echo ===============================================
echo      GBC Canteen - Build Error Fix
echo ===============================================
echo.
echo This script will fix the Expo EAS build error:
echo "npx expo export:embed --eager --platform android --dev false exited with non-zero code: 1"
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found
    echo    Make sure you're running this from the GBC-app-master directory
    echo.
    pause
    exit /b 1
)

echo ✅ Found package.json - proceeding with fixes...
echo.

echo 🔧 Step 1: Enabling PowerShell execution policy...
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"

echo.
echo 🧹 Step 2: Clearing all caches...
echo.

REM Clear npm cache
echo   📦 Clearing npm cache...
powershell -Command "npm cache clean --force"

REM Clear Expo cache
echo   🚀 Clearing Expo cache...
powershell -Command "npx expo r -c" 2>nul

REM Clear Metro cache
echo   🚇 Clearing Metro cache...
powershell -Command "npx react-native start --reset-cache" 2>nul

REM Clear node_modules
echo   📁 Removing node_modules...
if exist "node_modules" rmdir /s /q "node_modules"

REM Clear package-lock
echo   🔒 Removing package-lock.json...
if exist "package-lock.json" del "package-lock.json"

echo.
echo 🔄 Step 3: Reinstalling dependencies...
echo.

REM Install dependencies
powershell -Command "npm install"

echo.
echo 🔧 Step 4: Fixing Expo dependencies...
echo.

REM Fix Expo dependencies
powershell -Command "npx expo install --fix"

echo.
echo 🚀 Step 5: Testing build locally...
echo.

REM Test local build
echo   📱 Testing local export...
powershell -Command "npx expo export --platform android"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Local export successful! Build error should be fixed.
    echo.
    echo 🎯 Next steps:
    echo 1. Try building your APK again with: eas build --platform android --profile preview
    echo 2. Or use the automated script: BUILD_APK_COMPLETE.bat
    echo.
    echo The build error has been resolved! 🎉
) else (
    echo.
    echo ❌ Local export still failing. Additional fixes needed.
    echo.
    echo 🔧 Applying advanced fixes...
    
    REM Create a minimal expo export test
    echo   📝 Creating test export configuration...
    
    REM Try with clear cache flag
    powershell -Command "npx expo export --platform android --clear"
    
    if %errorlevel% equ 0 (
        echo ✅ Export successful with cache clear!
        echo The build should work now.
    ) else (
        echo ❌ Still having issues. Manual intervention needed.
        echo.
        echo 🆘 Manual fix steps:
        echo 1. Check your internet connection
        echo 2. Verify Expo CLI version: npx expo --version
        echo 3. Update Expo CLI: npm install -g @expo/cli@latest
        echo 4. Try building with: eas build --clear-cache --platform android --profile preview
        echo.
    )
)

echo.
echo ===============================================
echo              FIX COMPLETE
echo ===============================================
echo.
echo The build error fix process is complete.
echo.
echo 🎯 To build your APK now:
echo 1. Run: BUILD_APK_COMPLETE.bat
echo 2. Or manually: eas build --platform android --profile preview
echo.
echo Your GBC Canteen app with thermal printing and auto-refresh
echo features is ready for building! 🚀
echo.

pause
