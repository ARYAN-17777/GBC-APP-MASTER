# Universal QR Code for GBC Canteen App

## 🚀 Quick Start - Generate Your QR Code

**Step 1:** Run the development server
```bash
npx expo start
```

**Step 2:** Scan the QR code that appears in your terminal

## 📱 Development QR Code

When you run `npx expo start`, you'll see a QR code in your terminal that looks like this:

```
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ ▄▄▄▄▄ █▀█ █▄██▀▄▄▄▄██ ▄▄▄▄▄ █
█ █   █ █▀▀▀█ ▄▄▀█▄▄▄▄█ █   █ █
█ █▄▄▄█ █▀ ▀█▀▀▀▄▀▀▄▀▄█ █▄▄▄█ █
█▄▄▄▄▄▄▄█▄▀ ▀▄█▄█▄▀▄█▄█▄▄▄▄▄▄▄█
█▄▄▄▄  ▄▀▄▄▄▄▀██▄▀▀▀▄▀▀▄▄█▄▀▄▄█
█ ▄▀▄▄▄▄▄▀█▀▀▀▄▄▄█▄▄▄▄▀▀▀█▀▀▀▄█
█▄▄█▀▄▄▄▀▄▄▄▄▀▀▀▄▀▀▀▄▄▄▄▄▀▄▄▄▄█
█▄▄▄▄▄▄▄█▄▄█▄█▄▄▄█▄▄▄█ ▄▄▄▄▄ █
█ ▄▄▄▄▄ █▄▄▄▄▄▄▄▄▄▄▄▄█ █   █ █
█ █   █ █▄▄▄▄▄▄▄▄▄▄▄▄█ █▄▄▄█ █
█ █▄▄▄█ █▄▄▄▄▄▄▄▄▄▄▄▄█▄▄▄▄▄▄▄█
█▄▄▄▄▄▄▄█▄▄▄▄▄▄▄▄▄▄▄▄█▄▄▄▄▄▄▄█
```

**Development URL Format:** `exp://192.168.x.x:8081`

## 📲 How to Use:

### Step 1: Install Expo Go
- **iOS**: [Download from App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Download from Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Step 2: Scan QR Code
- **iOS**: Open Camera app → Point at QR code → Tap notification
- **Android**: Open Expo Go app → Tap "Scan QR Code" → Point at QR code

### Step 3: App Opens
The GBC Canteen app will load directly in Expo Go!

## 🌐 Alternative Access Methods

### Development Server URLs:
- **Local Network**: `exp://192.168.x.x:8081` (your computer's IP)
- **Localhost**: `exp://127.0.0.1:8081` (same device only)
- **Tunnel**: `exp://tunnel-url.exp.direct:80` (if using tunnel mode)

### Production URLs (after publishing):
- **Expo**: `exp://exp.host/@username/gbc-canteen`
- **Custom**: `gbc://` (using custom scheme)

## 🛠️ For Developers

### Generate QR Code:
1. Run: `npx expo start`
2. QR code appears in terminal
3. Share the QR code or URL with testers

### Tunnel Mode (for external testing):
```bash
npx expo start --tunnel
```
This creates a public URL that works from anywhere.

### Production Publishing:
```bash
npx expo publish
```
Creates a permanent URL for your app.

## 📋 Project Configuration
- **App Name**: General Bilimoria's Canteen
- **Slug**: gbc-canteen
- **Scheme**: gbc
- **Package**: com.generalbilimoria.canteen
- **Version**: 1.0.0

## 🔗 Generate Custom QR Codes
Use these tools to create QR codes for your URLs:
- [QR Code Generator](https://qr-generator.qrcode.studio/)
- [QR Code Monkey](https://www.qrcode-monkey.com/)
- [Google Charts QR API](https://developers.google.com/chart/infographics/docs/qr_codes)

