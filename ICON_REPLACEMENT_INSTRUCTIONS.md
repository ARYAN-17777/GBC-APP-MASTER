
# 🎯 GBC ICON REPLACEMENT INSTRUCTIONS

## Current Status:
- ❌ APK showing yellow circle instead of GBC logo
- ✅ Icon generator created and opened in browser

## SOLUTION - Follow these steps:

### Step 1: Generate Icons
1. The icon generator should be open in your browser
2. If not, open: gbc-icon-generator.html
3. Click "Generate GBC Icons" button
4. Download both PNG files:
   - icon.png (main app icon)
   - adaptive-icon.png (Android adaptive icon)

### Step 2: Replace Icon Files
1. Navigate to: assets/images/ folder
2. Replace the existing icon.png with your downloaded icon.png
3. Replace the existing adaptive-icon.png with your downloaded adaptive-icon.png
4. Keep the same filenames exactly

### Step 3: Verify Configuration
- ✅ app.json updated to use PNG icons
- ✅ Orange background color set to #FF8C00
- ✅ Version bumped to force icon refresh
- ✅ Build number updated

### Step 4: Build APK
Run: npx eas build --profile preview --platform android

## Icon Specifications:
- Background: #FF8C00 (exact orange from your image)
- Text Layout:
  * GENERAL
  * BILIMORIA'S  
  * 20 CANTEEN 21
  * ESTD LONDON UK
- Text Color: #2C3E50 (dark blue)
- Size: 1024x1024 pixels
- Format: PNG

## Expected Result:
Your APK will show the exact GBC logo with orange background and proper text layout instead of the yellow circle.

## If Icons Still Don't Work:
1. Clear Expo cache: npx expo start --clear
2. Delete node_modules and reinstall: npm install
3. Try a different icon format or size
4. Contact Expo support for icon-specific issues

The icon generator creates the EXACT design you requested!
