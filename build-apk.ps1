# General Bilimoria's Canteen - APK Builder Script
# PowerShell script to build Android APK

Write-Host "🍽️  General Bilimoria's Canteen - APK Builder" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "❌ npm not found. Please install npm first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js and npm found" -ForegroundColor Green

# Check if EAS CLI is installed
if (-not (Test-Command "eas")) {
    Write-Host "📦 Installing EAS CLI..." -ForegroundColor Yellow
    npm install -g eas-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install EAS CLI" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ EAS CLI ready" -ForegroundColor Green
Write-Host ""

# Show build options
Write-Host "🔧 Build Options:" -ForegroundColor Cyan
Write-Host "1. EAS Build (Cloud) - Recommended" -ForegroundColor White
Write-Host "2. Local Export + Manual Build" -ForegroundColor White
Write-Host "3. Development Build" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Select build method (1-3)"

switch ($choice) {
    "1" {
        Write-Host "🚀 Starting EAS Cloud Build..." -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 You'll need to:" -ForegroundColor Yellow
        Write-Host "   1. Create a free account at https://expo.dev" -ForegroundColor White
        Write-Host "   2. Login when prompted" -ForegroundColor White
        Write-Host ""
        
        # Login to EAS
        Write-Host "🔐 Please login to EAS..." -ForegroundColor Yellow
        eas login
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Login successful" -ForegroundColor Green
            Write-Host ""
            Write-Host "🏗️  Building APK (this may take 10-15 minutes)..." -ForegroundColor Yellow
            eas build --platform android --profile preview
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "🎉 APK built successfully!" -ForegroundColor Green
                Write-Host "📱 Download your APK from the EAS dashboard" -ForegroundColor Cyan
                Write-Host "🌐 Visit: https://expo.dev/accounts/[your-username]/projects/gbc/builds" -ForegroundColor Cyan
            } else {
                Write-Host "❌ Build failed. Check the error messages above." -ForegroundColor Red
            }
        } else {
            Write-Host "❌ Login failed. Please check your credentials." -ForegroundColor Red
        }
    }
    
    "2" {
        Write-Host "📦 Exporting app bundle..." -ForegroundColor Green
        npx expo export --platform android
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Export successful" -ForegroundColor Green
            Write-Host ""
            Write-Host "📁 Bundle exported to: dist/" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "🔧 To complete the build:" -ForegroundColor Yellow
            Write-Host "   1. Install Android Studio" -ForegroundColor White
            Write-Host "   2. Open the android/ folder in Android Studio" -ForegroundColor White
            Write-Host "   3. Run: Build > Generate Signed Bundle/APK" -ForegroundColor White
            Write-Host "   4. Choose APK and use the existing keystore" -ForegroundColor White
        } else {
            Write-Host "❌ Export failed" -ForegroundColor Red
        }
    }
    
    "3" {
        Write-Host "🔧 Building development APK..." -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 You'll need to login to EAS first..." -ForegroundColor Yellow
        eas login
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Login successful" -ForegroundColor Green
            Write-Host ""
            Write-Host "🏗️  Building development APK..." -ForegroundColor Yellow
            eas build --platform android --profile development
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "🎉 Development APK built successfully!" -ForegroundColor Green
                Write-Host "📱 This APK includes development tools" -ForegroundColor Cyan
            } else {
                Write-Host "❌ Build failed. Check the error messages above." -ForegroundColor Red
            }
        }
    }
    
    default {
        Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📋 App Information:" -ForegroundColor Cyan
Write-Host "   Name: General Bilimoria's Canteen" -ForegroundColor White
Write-Host "   Package: com.generalbilimoria.canteen" -ForegroundColor White
Write-Host "   Version: 1.0.2" -ForegroundColor White
Write-Host "   Features: Restaurant Management, Dark/Light Theme, Settings" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Build process completed!" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"
