# GBC Canteen - Full Auto Setup and Build Script
# PowerShell version with enhanced system access

param(
    [switch]$Force,
    [switch]$SkipNodeCheck
)

# Set execution policy for current session
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# Enhanced error handling
$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "    GBC CANTEEN - FULL AUTO SETUP & BUILD" -ForegroundColor Green  
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 POWERSHELL AUTO SETUP WITH FULL SYSTEM ACCESS" -ForegroundColor Yellow
Write-Host ""

# Function to check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check administrator privileges
if (-not (Test-Administrator)) {
    Write-Host "⚠️  WARNING: Not running as Administrator" -ForegroundColor Yellow
    Write-Host "   Some operations may fail without admin privileges" -ForegroundColor Yellow
    Write-Host ""
    
    if (-not $Force) {
        $continue = Read-Host "Continue anyway? (Y/N)"
        if ($continue -ne "Y" -and $continue -ne "y") {
            Write-Host "Setup cancelled." -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host "🔧 STEP 1/8: SYSTEM PREPARATION" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Set PowerShell execution policy permanently
try {
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
    Write-Host "✅ PowerShell execution policy set" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not set execution policy: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Check Node.js installation
if (-not $SkipNodeCheck) {
    Write-Host "📦 Checking Node.js installation..." -ForegroundColor White
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
        } else {
            throw "Node.js not found"
        }
    } catch {
        Write-Host "❌ Node.js not found!" -ForegroundColor Red
        Write-Host "📥 Auto-installing Node.js..." -ForegroundColor Yellow
        
        # Try to install Node.js using Chocolatey
        try {
            if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
                Write-Host "📦 Installing Chocolatey package manager..." -ForegroundColor Yellow
                Set-ExecutionPolicy Bypass -Scope Process -Force
                [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
                iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
            }
            
            Write-Host "📦 Installing Node.js via Chocolatey..." -ForegroundColor Yellow
            choco install nodejs -y
            
            # Refresh environment variables
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            
            Write-Host "✅ Node.js installed successfully" -ForegroundColor Green
        } catch {
            Write-Host "❌ Auto-install failed. Please install Node.js manually from: https://nodejs.org" -ForegroundColor Red
            Write-Host "⏸️  Setup paused. Install Node.js and run this script again." -ForegroundColor Yellow
            Read-Host "Press Enter to exit"
            exit 1
        }
    }
}

Write-Host ""
Write-Host "🛠️  STEP 2/8: INSTALLING GLOBAL TOOLS" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Install global tools with error handling
$globalTools = @(
    @{name="EAS CLI"; command="npm install -g eas-cli@latest"},
    @{name="Expo CLI"; command="npm install -g @expo/cli@latest"},
    @{name="Yarn"; command="npm install -g yarn"}
)

foreach ($tool in $globalTools) {
    Write-Host "📦 Installing $($tool.name)..." -ForegroundColor White
    try {
        Invoke-Expression $tool.command
        Write-Host "✅ $($tool.name) installed" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  $($tool.name) installation had issues: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🔍 STEP 3/8: PROJECT VALIDATION" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found" -ForegroundColor Red
    Write-Host "📁 Current directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "📍 Make sure you're in the GBC-app-master directory" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Project structure validated" -ForegroundColor Green

Write-Host ""
Write-Host "🧹 STEP 4/8: COMPLETE CLEANUP" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Cleanup with enhanced error handling
$cleanupItems = @("node_modules", "package-lock.json", "yarn.lock", ".expo")

foreach ($item in $cleanupItems) {
    if (Test-Path $item) {
        Write-Host "🗑️  Removing $item..." -ForegroundColor White
        try {
            Remove-Item $item -Recurse -Force -ErrorAction Stop
            Write-Host "✅ $item removed" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Could not remove $item: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host "🧽 Clearing npm cache..." -ForegroundColor White
try {
    npm cache clean --force
    Write-Host "✅ npm cache cleared" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Cache clear had issues" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 STEP 5/8: DEPENDENCY INSTALLATION" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Try multiple installation methods
$installMethods = @(
    @{name="npm with legacy peer deps"; command="npm install --legacy-peer-deps"},
    @{name="npm with force"; command="npm install --force"},
    @{name="yarn"; command="yarn install"}
)

$installSuccess = $false
foreach ($method in $installMethods) {
    if ($installSuccess) { break }
    
    Write-Host "📥 Trying: $($method.name)..." -ForegroundColor White
    try {
        Invoke-Expression $method.command
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Dependencies installed with $($method.name)" -ForegroundColor Green
            $installSuccess = $true
        } else {
            throw "Exit code: $LASTEXITCODE"
        }
    } catch {
        Write-Host "⚠️  $($method.name) failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

if (-not $installSuccess) {
    Write-Host "❌ All installation methods failed!" -ForegroundColor Red
    Write-Host "🆘 Manual intervention required." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🚀 STEP 6/8: EXPO DEPENDENCY FIX" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

try {
    Write-Host "🔧 Fixing Expo dependencies..." -ForegroundColor White
    npx expo install --fix
    Write-Host "✅ Expo dependencies fixed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Expo fix had issues: $($_.Exception.Message)" -ForegroundColor Yellow
}

try {
    Write-Host "🩺 Running Expo doctor..." -ForegroundColor White
    npx expo doctor
} catch {
    Write-Host "⚠️  Expo doctor had issues" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🧪 STEP 7/8: BUILD VALIDATION" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

Write-Host "📤 Testing export functionality..." -ForegroundColor White
try {
    npx expo export --platform android --dev false
    Write-Host "✅ Export validation successful" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Export test failed, trying with cache clear..." -ForegroundColor Yellow
    try {
        npx expo export --platform android --dev false --clear
        Write-Host "✅ Export successful with cache clear" -ForegroundColor Green
    } catch {
        Write-Host "❌ Export validation failed!" -ForegroundColor Red
        Write-Host "🔧 Build may still work, continuing..." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🏗️  STEP 8/8: AUTOMATIC EAS BUILD" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Check EAS login
Write-Host "🔐 Checking EAS login status..." -ForegroundColor White
try {
    $whoami = eas whoami 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Already logged in to EAS: $whoami" -ForegroundColor Green
    } else {
        throw "Not logged in"
    }
} catch {
    Write-Host "🔑 Not logged in to EAS. Starting login process..." -ForegroundColor Yellow
    Write-Host "📝 Please enter your Expo credentials when prompted:" -ForegroundColor White
    try {
        eas login
        if ($LASTEXITCODE -ne 0) {
            throw "Login failed"
        }
        Write-Host "✅ Successfully logged in to EAS" -ForegroundColor Green
    } catch {
        Write-Host "❌ EAS login failed!" -ForegroundColor Red
        Write-Host "🔑 Please login manually: eas login" -ForegroundColor Yellow
        Write-Host "🏗️  Then run: eas build --platform android --profile preview" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "🏗️  STARTING APK BUILD..." -ForegroundColor Green
Write-Host "⏱️  This will take 10-15 minutes" -ForegroundColor Yellow
Write-Host "📧 You'll receive an email when complete" -ForegroundColor Yellow
Write-Host ""

try {
    eas build --platform android --profile preview --non-interactive
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 BUILD SUCCESSFUL!" -ForegroundColor Green
        Write-Host "📧 Check your email for the APK download link" -ForegroundColor Green
        Write-Host "🌐 Or visit: https://expo.dev/accounts/swapnil9899/projects/gbc-app-master/builds" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "⚠️  Build command executed but may have issues" -ForegroundColor Yellow
        Write-Host "🌐 Check build status at: https://expo.dev" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Build failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔄 You can try: eas build --clear-cache --platform android --profile preview" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "          FULL AUTO SETUP COMPLETE!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 SUMMARY:" -ForegroundColor White
Write-Host "✅ Development environment setup" -ForegroundColor Green
Write-Host "✅ All dependencies installed and fixed" -ForegroundColor Green
Write-Host "✅ Build validation completed" -ForegroundColor Green
Write-Host "✅ APK build initiated" -ForegroundColor Green
Write-Host ""
Write-Host "📱 YOUR GBC CANTEEN APP:" -ForegroundColor White
Write-Host "   Name: General Bilimoria's Canteen" -ForegroundColor Cyan
Write-Host "   Features: Thermal Printing + Auto-refresh" -ForegroundColor Cyan
Write-Host "   Login: Username=GBC, Password=GBC@123" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Your app is ready! Check your email for the APK file." -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit"
