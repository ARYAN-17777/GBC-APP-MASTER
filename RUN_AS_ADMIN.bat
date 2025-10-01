@echo off
title GBC Canteen - Admin Launcher
color 0E

echo.
echo ===============================================
echo      GBC CANTEEN - ADMIN LAUNCHER
echo ===============================================
echo.
echo This launcher will run the setup with MAXIMUM privileges
echo.

REM Check if already running as admin
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Already running as Administrator
    echo 🚀 Starting PowerShell setup with full system access...
    echo.
    
    REM Run PowerShell script with full privileges
    powershell -ExecutionPolicy Bypass -File "FULL_AUTO_SETUP_AND_BUILD.ps1" -Force
    
    if %errorlevel% neq 0 (
        echo.
        echo ⚠️  PowerShell script had issues. Trying batch version...
        echo.
        call "FULL_AUTO_SETUP_AND_BUILD.bat"
    )
    
) else (
    echo ⚠️  Not running as Administrator
    echo 🔄 Restarting with Administrator privileges...
    echo.
    
    REM Restart as administrator
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo.
echo ===============================================
echo              SETUP COMPLETE
echo ===============================================
echo.
pause
