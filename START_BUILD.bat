@echo off
echo 🚀 Starting EAS Build for GBC Canteen App...
echo.

REM Set environment variable to bypass Git
set EAS_NO_VCS=1

REM Navigate to project directory
cd /d "E:\GBC\GBC\GBC-app-master"

REM Start the build
echo ⚡ Starting Android APK build...
eas build --platform android --profile preview

echo.
echo ✅ Build command executed!
echo 📧 Check your email for the download link when build completes.
pause
