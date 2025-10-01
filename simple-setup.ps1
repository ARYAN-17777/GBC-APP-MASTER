# Simple setup script for GBC APK build environment
Write-Host "🚀 Setting up GBC APK build environment..." -ForegroundColor Green

# Check if running as administrator
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script requires Administrator privileges." -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Running with Administrator privileges" -ForegroundColor Green

# Function to test if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Install Chocolatey if not present
if (-not (Test-Command "choco")) {
    Write-Host "📦 Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    try {
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Host "✅ Chocolatey installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install Chocolatey: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Chocolatey already installed" -ForegroundColor Green
}

# Refresh environment variables
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Install Node.js if not present
if (-not (Test-Command "node")) {
    Write-Host "📦 Installing Node.js..." -ForegroundColor Yellow
    try {
        & choco install nodejs -y
        Write-Host "✅ Node.js installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install Node.js: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    $nodeVersion = & node --version 2>$null
    Write-Host "✅ Node.js already installed: $nodeVersion" -ForegroundColor Green
}

# Refresh environment variables again
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Install Java if not present
if (-not (Test-Command "java")) {
    Write-Host "📦 Installing Java JDK..." -ForegroundColor Yellow
    try {
        & choco install openjdk17 -y
        Write-Host "✅ Java JDK installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install Java: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Java already installed" -ForegroundColor Green
}

# Refresh environment variables again
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Install EAS CLI if not present
if (-not (Test-Command "eas")) {
    Write-Host "📦 Installing EAS CLI..." -ForegroundColor Yellow
    try {
        & npm install -g @expo/eas-cli
        Write-Host "✅ EAS CLI installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install EAS CLI: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    $easVersion = & eas --version 2>$null
    Write-Host "✅ EAS CLI already installed: $easVersion" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host "Please restart your terminal and run:" -ForegroundColor Yellow
Write-Host "cd E:\GBC\GBC\GBC-app-master" -ForegroundColor White
Write-Host "eas build --platform android --profile preview" -ForegroundColor White
Write-Host ""
