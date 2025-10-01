# GBC Canteen - Build Environment Setup Script
# PowerShell script to install all required dependencies for APK building

param(
    [switch]$SkipChocolatey,
    [switch]$SkipNodeJS,
    [switch]$SkipJava,
    [switch]$QuickSetup
)

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"
$White = "White"

function Write-Header {
    param($Text)
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor $Cyan
    Write-Host "  $Text" -ForegroundColor $Green
    Write-Host "=" * 60 -ForegroundColor $Cyan
    Write-Host ""
}

function Write-Step {
    param($Step, $Text)
    Write-Host "[$Step] $Text" -ForegroundColor $Yellow
}

function Write-Success {
    param($Text)
    Write-Host "✅ $Text" -ForegroundColor $Green
}

function Write-Error {
    param($Text)
    Write-Host "❌ $Text" -ForegroundColor $Red
}

function Write-Info {
    param($Text)
    Write-Host "ℹ️  $Text" -ForegroundColor $Cyan
}

function Test-Command {
    param($CommandName)
    return [bool](Get-Command -Name $CommandName -ErrorAction SilentlyContinue)
}

function Test-AdminRights {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Main setup function
function Start-Setup {
    Write-Header "GBC Canteen APK Build Environment Setup"
    
    Write-Info "This script will install the required tools for building the GBC Canteen APK:"
    Write-Host "  • Node.js (for npm, Expo CLI, EAS CLI)" -ForegroundColor $White
    Write-Host "  • Java JDK (for Android builds)" -ForegroundColor $White
    Write-Host "  • EAS CLI (for Expo cloud builds)" -ForegroundColor $White
    Write-Host ""
    
    # Check admin rights
    if (-not (Test-AdminRights)) {
        Write-Error "This script requires Administrator privileges."
        Write-Info "Please run PowerShell as Administrator and try again."
        Write-Host ""
        Write-Host "To run as Administrator:" -ForegroundColor $Yellow
        Write-Host "1. Right-click on PowerShell" -ForegroundColor $White
        Write-Host "2. Select 'Run as Administrator'" -ForegroundColor $White
        Write-Host "3. Run this script again" -ForegroundColor $White
        exit 1
    }
    
    Write-Success "Running with Administrator privileges"
    
    # Step 1: Install Chocolatey (package manager)
    if (-not $SkipChocolatey) {
        Write-Step "1/5" "Installing Chocolatey Package Manager"
        
        if (Test-Command "choco") {
            Write-Success "Chocolatey is already installed"
        } else {
            try {
                Write-Info "Installing Chocolatey..."
                Set-ExecutionPolicy Bypass -Scope Process -Force
                [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
                Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
                
                # Refresh environment
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
                
                if (Test-Command "choco") {
                    Write-Success "Chocolatey installed successfully"
                } else {
                    Write-Error "Chocolatey installation failed"
                    exit 1
                }
            } catch {
                Write-Error "Failed to install Chocolatey: $($_.Exception.Message)"
                exit 1
            }
        }
    }
    
    # Step 2: Install Node.js
    if (-not $SkipNodeJS) {
        Write-Step "2/5" "Installing Node.js"
        
        if (Test-Command "node") {
            $nodeVersion = & node --version 2>$null
            Write-Success "Node.js is already installed: $nodeVersion"
        } else {
            try {
                Write-Info "Installing Node.js LTS..."
                & choco install nodejs -y
                
                # Refresh environment
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
                
                if (Test-Command "node") {
                    $nodeVersion = & node --version 2>$null
                    Write-Success "Node.js installed successfully: $nodeVersion"
                } else {
                    Write-Error "Node.js installation failed"
                    exit 1
                }
            } catch {
                Write-Error "Failed to install Node.js: $($_.Exception.Message)"
                exit 1
            }
        }
    }
    
    # Step 3: Install Java JDK
    if (-not $SkipJava) {
        Write-Step "3/5" "Installing Java JDK"
        
        if (Test-Command "java") {
            $javaVersion = & java -version 2>&1 | Select-String "version" | Select-Object -First 1
            Write-Success "Java is already installed: $javaVersion"
        } else {
            try {
                Write-Info "Installing OpenJDK 17..."
                & choco install openjdk17 -y
                
                # Refresh environment
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
                
                if (Test-Command "java") {
                    $javaVersion = & java -version 2>&1 | Select-String "version" | Select-Object -First 1
                    Write-Success "Java installed successfully: $javaVersion"
                } else {
                    Write-Error "Java installation failed"
                    exit 1
                }
            } catch {
                Write-Error "Failed to install Java: $($_.Exception.Message)"
                exit 1
            }
        }
    }
    
    # Step 4: Install EAS CLI
    Write-Step "4/5" "Installing EAS CLI"
    
    if (Test-Command "eas") {
        $easVersion = & eas --version 2>$null
        Write-Success "EAS CLI is already installed: $easVersion"
    } else {
        try {
            Write-Info "Installing EAS CLI..."
            & npm install -g @expo/eas-cli
            
            # Refresh environment
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            
            if (Test-Command "eas") {
                $easVersion = & eas --version 2>$null
                Write-Success "EAS CLI installed successfully: $easVersion"
            } else {
                Write-Error "EAS CLI installation failed"
                exit 1
            }
        } catch {
            Write-Error "Failed to install EAS CLI: $($_.Exception.Message)"
            exit 1
        }
    }
    
    # Step 5: Verify installation
    Write-Step "5/5" "Verifying Installation"
    
    $allGood = $true
    
    if (Test-Command "node") {
        $nodeVersion = & node --version 2>$null
        Write-Success "Node.js: $nodeVersion"
    } else {
        Write-Error "Node.js: Not found"
        $allGood = $false
    }
    
    if (Test-Command "npm") {
        $npmVersion = & npm --version 2>$null
        Write-Success "npm: $npmVersion"
    } else {
        Write-Error "npm: Not found"
        $allGood = $false
    }
    
    if (Test-Command "java") {
        $javaVersion = & java -version 2>&1 | Select-String "version" | Select-Object -First 1
        Write-Success "Java: $javaVersion"
    } else {
        Write-Error "Java: Not found"
        $allGood = $false
    }
    
    if (Test-Command "eas") {
        $easVersion = & eas --version 2>$null
        Write-Success "EAS CLI: $easVersion"
    } else {
        Write-Error "EAS CLI: Not found"
        $allGood = $false
    }
    
    Write-Host ""
    
    if ($allGood) {
        Write-Header "🎉 Setup Complete!"
        Write-Success "All required tools are installed and ready!"
        Write-Host ""
        Write-Info "Next steps:"
        Write-Host "1. Close this PowerShell window" -ForegroundColor $White
        Write-Host "2. Open a new PowerShell/Command Prompt" -ForegroundColor $White
        Write-Host "3. Navigate to your project: cd E:\GBC\GBC\GBC-app-master" -ForegroundColor $White
        Write-Host "4. Run: eas build --platform android --profile preview" -ForegroundColor $White
        Write-Host ""
        Write-Info "The APK build should now work successfully!"
    } else {
        Write-Header "❌ Setup Failed"
        Write-Error "Some tools failed to install. Please check the errors above."
        Write-Info "You may need to:"
        Write-Host "• Restart your computer" -ForegroundColor $White
        Write-Host "• Run this script again" -ForegroundColor $White
        Write-Host "• Install tools manually" -ForegroundColor $White
        exit 1
    }
}

# Quick setup mode
if ($QuickSetup) {
    Write-Host "🚀 Quick Setup Mode - Installing all dependencies..." -ForegroundColor $Green
    Start-Setup
} else {
    # Interactive mode
    Write-Host "🛠️  GBC Canteen Build Environment Setup" -ForegroundColor $Green
    Write-Host ""
    Write-Host "This will install:" -ForegroundColor $Yellow
    Write-Host "• Chocolatey (package manager)" -ForegroundColor $White
    Write-Host "• Node.js (JavaScript runtime)" -ForegroundColor $White
    Write-Host "• Java JDK (for Android builds)" -ForegroundColor $White
    Write-Host "• EAS CLI (Expo build tools)" -ForegroundColor $White
    Write-Host ""
    
    $confirm = Read-Host "Continue with installation? (y/N)"
    if ($confirm -eq 'y' -or $confirm -eq 'Y' -or $confirm -eq 'yes') {
        Start-Setup
    } else {
        Write-Host "Setup cancelled." -ForegroundColor $Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor $Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
