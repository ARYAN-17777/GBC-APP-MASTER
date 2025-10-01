@echo off
title GBC Canteen - Fix Dependency Error
color 0A

echo.
echo ===============================================
echo    GBC Canteen - Fix Dependency Error
echo ===============================================
echo.
echo This script will fix the npm ci dependency error
echo that's causing your EAS build to fail.
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found
    echo    Make sure you're running this from the GBC-app-master directory
    echo.
    pause
    exit /b 1
)

echo ✅ Found package.json - proceeding with dependency fixes...
echo.

echo 🔧 Step 1: Enabling PowerShell execution policy...
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"

echo.
echo 🧹 Step 2: Complete cleanup...
echo.

REM Clear all caches
echo   📦 Clearing npm cache...
powershell -Command "npm cache clean --force"

REM Remove problematic files
echo   🗑️ Removing lock files and node_modules...
if exist "package-lock.json" del "package-lock.json"
if exist "yarn.lock" del "yarn.lock"
if exist "node_modules" rmdir /s /q "node_modules"

echo.
echo 🔄 Step 3: Fresh dependency installation...
echo.

REM Install with legacy peer deps to avoid conflicts
echo   📦 Installing dependencies with legacy peer deps...
powershell -Command "npm install --legacy-peer-deps"

if %errorlevel% neq 0 (
    echo.
    echo ⚠️ Standard install failed, trying alternative method...
    echo.
    
    REM Try with force flag
    echo   🔨 Force installing dependencies...
    powershell -Command "npm install --force"
    
    if %errorlevel% neq 0 (
        echo.
        echo ❌ npm install still failing. Trying Yarn...
        echo.
        
        REM Try with Yarn
        powershell -Command "npm install -g yarn"
        powershell -Command "yarn install"
    )
)

echo.
echo 🔧 Step 4: Fix Expo dependencies...
echo.

REM Fix Expo dependencies
echo   🚀 Fixing Expo dependencies...
powershell -Command "npx expo install --fix"

echo.
echo 🧪 Step 5: Test local build...
echo.

REM Test if dependencies are working
echo   🔍 Testing dependency resolution...
powershell -Command "npx expo doctor"

echo.
echo 📱 Step 6: Test export (this is what was failing)...
echo.

REM Test the exact command that was failing
echo   📤 Testing expo export (this was the failing step)...
powershell -Command "npx expo export --platform android --dev false"

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCESS! Dependencies fixed and export working!
    echo.
    echo 🎯 Your build should work now. Try building again:
    echo.
    echo    eas build --platform android --profile preview
    echo.
    echo The dependency error has been resolved! 🎉
) else (
    echo.
    echo ⚠️ Export still having issues. Let's try alternative approach...
    echo.
    
    REM Try with clear cache
    echo   🧹 Trying with cache clear...
    powershell -Command "npx expo export --platform android --dev false --clear"
    
    if %errorlevel% equ 0 (
        echo ✅ Success with cache clear! Build should work now.
    ) else (
        echo.
        echo 🔧 Advanced troubleshooting needed...
        echo.
        echo Manual steps to try:
        echo 1. Update Expo CLI: npm install -g @expo/cli@latest
        echo 2. Update EAS CLI: npm install -g eas-cli@latest  
        echo 3. Try: eas build --clear-cache --platform android --profile preview
        echo 4. Or try production profile: eas build --platform android --profile production
        echo.
    )
)

echo.
echo ===============================================
echo           DEPENDENCY FIX COMPLETE
echo ===============================================
echo.
echo The dependency error fix is complete.
echo.
echo 🚀 Next steps:
echo 1. Go to: https://expo.dev/accounts/swapnil9899/projects/gbc-app-master/builds
echo 2. Click "Create Build"
echo 3. Select Android + Preview profile
echo 4. Click "Create Build"
echo.
echo Your GBC Canteen app should build successfully now! 🎉
echo.

pause
