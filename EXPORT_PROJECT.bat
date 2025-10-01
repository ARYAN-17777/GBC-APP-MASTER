@echo off
title GBC Canteen - Project Export Tool
color 0B

echo.
echo ===============================================
echo      GBC Canteen - Project Export Tool
echo ===============================================
echo.
echo This script will create a portable package of your
echo GBC Canteen project that can be transferred to any
echo computer for APK building.
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found
    echo    Make sure you're running this from the GBC-app-master directory
    echo.
    pause
    exit /b 1
)

echo ✅ Found package.json - proceeding with export...
echo.

REM Create export directory with timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"

set "EXPORT_DIR=GBC-Canteen-Export_%timestamp%"
set "EXPORT_PATH=%CD%\%EXPORT_DIR%"

echo 📦 Creating export package: %EXPORT_DIR%
echo.

REM Create export directory
mkdir "%EXPORT_PATH%" 2>nul

echo 📋 Copying project files...

REM Copy essential files and directories
echo   ✅ Copying app source code...
xcopy "app" "%EXPORT_PATH%\app" /E /I /Q >nul 2>&1

echo   ✅ Copying assets...
xcopy "assets" "%EXPORT_PATH%\assets" /E /I /Q >nul 2>&1

echo   ✅ Copying utilities...
xcopy "utils" "%EXPORT_PATH%\utils" /E /I /Q >nul 2>&1

echo   ✅ Copying services...
xcopy "services" "%EXPORT_PATH%\services" /E /I /Q >nul 2>&1

echo   ✅ Copying components...
xcopy "components" "%EXPORT_PATH%\components" /E /I /Q >nul 2>&1

echo   ✅ Copying contexts...
xcopy "contexts" "%EXPORT_PATH%\contexts" /E /I /Q >nul 2>&1

echo   ✅ Copying config...
xcopy "config" "%EXPORT_PATH%\config" /E /I /Q >nul 2>&1

echo   ✅ Copying scripts...
xcopy "scripts" "%EXPORT_PATH%\scripts" /E /I /Q >nul 2>&1

REM Copy configuration files
echo   ✅ Copying configuration files...
copy "package.json" "%EXPORT_PATH%\" >nul 2>&1
copy "app.json" "%EXPORT_PATH%\" >nul 2>&1
copy "eas.json" "%EXPORT_PATH%\" >nul 2>&1
copy "tsconfig.json" "%EXPORT_PATH%\" >nul 2>&1
copy "babel.config.js" "%EXPORT_PATH%\" >nul 2>&1
copy "metro.config.js" "%EXPORT_PATH%\" >nul 2>&1
copy "expo-env.d.ts" "%EXPORT_PATH%\" >nul 2>&1

REM Copy build and validation scripts
echo   ✅ Copying build scripts...
copy "BUILD_APK_COMPLETE.bat" "%EXPORT_PATH%\" >nul 2>&1
copy "validate-project.js" "%EXPORT_PATH%\" >nul 2>&1
copy "COMPLETE_APK_BUILD_GUIDE.md" "%EXPORT_PATH%\" >nul 2>&1

REM Copy any additional important files
if exist "README.md" copy "README.md" "%EXPORT_PATH%\" >nul 2>&1
if exist ".gitignore" copy ".gitignore" "%EXPORT_PATH%\" >nul 2>&1

REM Create a setup instructions file
echo   ✅ Creating setup instructions...
(
echo # GBC Canteen - Exported Project
echo.
echo ## Quick Setup Instructions
echo.
echo 1. **Install Node.js**: Download from https://nodejs.org/
echo 2. **Install Java JDK**: Download from https://adoptium.net/
echo 3. **Open terminal** in this directory
echo 4. **Run**: BUILD_APK_COMPLETE.bat
echo.
echo ## Manual Setup
echo.
echo 1. Install dependencies: `npm install`
echo 2. Login to Expo: `eas login`
echo 3. Build APK: `npm run build:preview`
echo.
echo ## Project Features
echo.
echo ✅ Thermal Receipt Printing ^(Swift 2 Pro^)
echo ✅ Auto-refresh every 2 seconds
echo ✅ Complete restaurant management system
echo ✅ Real-time order updates
echo ✅ Dark/Light theme support
echo.
echo ## Login Credentials
echo.
echo - Username: GBC
echo - Password: GBC@123
echo.
echo ## Support
echo.
echo For detailed instructions, see: COMPLETE_APK_BUILD_GUIDE.md
) > "%EXPORT_PATH%\README.md"

REM Create a quick start batch file
echo   ✅ Creating quick start script...
(
echo @echo off
echo title GBC Canteen - Quick Start
echo.
echo echo ===============================================
echo echo      GBC Canteen - Quick Start
echo echo ===============================================
echo echo.
echo echo This will automatically build your APK.
echo echo Make sure you have Node.js and Java installed.
echo echo.
echo echo Press any key to start...
echo pause ^>nul
echo.
echo BUILD_APK_COMPLETE.bat
) > "%EXPORT_PATH%\QUICK_START.bat"

echo.
echo ===============================================
echo           EXPORT SUMMARY
echo ===============================================
echo.

REM Calculate export size
for /f "usebackq" %%A in (`dir "%EXPORT_PATH%" /s /-c ^| find "File(s)"`) do set size=%%A
echo 📊 Export Statistics:
echo   📁 Export Directory: %EXPORT_DIR%
echo   📦 Package Size: %size% bytes
echo   📅 Created: %timestamp%
echo.

echo ✅ Files Exported:
echo   📱 App source code
echo   🖼️ Assets and images
echo   🔧 Configuration files
echo   🛠️ Build scripts
echo   📚 Documentation
echo   🚀 Quick start tools
echo.

echo ===============================================
echo              NEXT STEPS
echo ===============================================
echo.
echo 1. **Transfer the folder** "%EXPORT_DIR%" to your build machine
echo.
echo 2. **On the build machine:**
echo    - Install Node.js from https://nodejs.org/
echo    - Install Java JDK from https://adoptium.net/
echo    - Run QUICK_START.bat in the exported folder
echo.
echo 3. **Alternative manual build:**
echo    - Open terminal in the exported folder
echo    - Run: npm install
echo    - Run: eas login
echo    - Run: npm run build:preview
echo.
echo 4. **For detailed instructions:**
echo    - Read: COMPLETE_APK_BUILD_GUIDE.md
echo.

echo ===============================================
echo              EXPORT COMPLETE!
echo ===============================================
echo.
echo 🎉 Your GBC Canteen project has been exported successfully!
echo.
echo 📁 Export Location: %EXPORT_PATH%
echo.
echo The exported package contains everything needed to build
echo your professional restaurant management app with thermal
echo printing capabilities on any Windows computer.
echo.
echo Press any key to open the export folder...
pause >nul

REM Open the export folder
explorer "%EXPORT_PATH%"

echo.
echo Export complete! You can now transfer the folder to any computer.
echo.
pause
