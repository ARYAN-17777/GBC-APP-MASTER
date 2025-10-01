@echo off
echo Building General Bilimoria's Canteen APK...
echo.

echo Step 1: Exporting app bundle...
call npx expo export --platform android
if %errorlevel% neq 0 (
    echo Failed to export app bundle
    pause
    exit /b 1
)

echo.
echo Step 2: Building APK...
cd android
call gradlew.bat assembleRelease
if %errorlevel% neq 0 (
    echo Failed to build APK
    cd ..
    pause
    exit /b 1
)

cd ..
echo.
echo ✅ APK built successfully!
echo Location: android\app\build\outputs\apk\release\app-release.apk
echo.
pause