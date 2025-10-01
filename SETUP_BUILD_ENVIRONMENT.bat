@echo off
title GBC Canteen - Build Environment Setup
color 0A

echo.
echo ===============================================
echo    GBC Canteen - Build Environment Setup
echo ===============================================
echo.
echo This script will install all required tools for building the GBC Canteen APK:
echo.
echo   * Node.js (for npm, Expo CLI, EAS CLI)
echo   * Java JDK (for Android builds)  
echo   * EAS CLI (for Expo cloud builds)
echo.
echo IMPORTANT: This script requires Administrator privileges!
echo.
echo If you see permission errors:
echo 1. Right-click on this file
echo 2. Select "Run as administrator"
echo 3. Try again
echo.
pause

echo.
echo Starting PowerShell setup script...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0setup-build-environment.ps1" -QuickSetup

if %errorlevel% equ 0 (
    echo.
    echo ===============================================
    echo           SETUP COMPLETED SUCCESSFULLY!
    echo ===============================================
    echo.
    echo All required tools have been installed.
    echo.
    echo NEXT STEPS:
    echo 1. Close this window
    echo 2. Open a new Command Prompt or PowerShell
    echo 3. Navigate to: cd E:\GBC\GBC\GBC-app-master
    echo 4. Run: eas build --platform android --profile preview
    echo.
    echo The APK build should now work successfully!
    echo.
) else (
    echo.
    echo ===============================================
    echo              SETUP FAILED!
    echo ===============================================
    echo.
    echo Some tools failed to install.
    echo.
    echo TROUBLESHOOTING:
    echo 1. Make sure you're running as Administrator
    echo 2. Check your internet connection
    echo 3. Restart your computer and try again
    echo 4. See BUILD_ERRORS_AND_SOLUTIONS.md for manual installation
    echo.
)

echo.
echo Press any key to exit...
pause >nul
