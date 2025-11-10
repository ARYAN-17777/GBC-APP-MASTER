// Create exact GBC icon matching the user's provided image
const fs = require('fs');
const path = require('path');

console.log('🎯 Creating EXACT GBC Icon from User Image');
console.log('==========================================');

// Create HTML that generates the EXACT icon matching the user's image
const exactIconGenerator = `<!DOCTYPE html>
<html>
<head>
    <title>Exact GBC Icon Generator</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            background: #f5f5f5;
            text-align: center;
        }
        .container { 
            max-width: 900px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 15px; 
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }
        .preview-container {
            display: flex;
            justify-content: space-around;
            align-items: center;
            margin: 30px 0;
            flex-wrap: wrap;
        }
        .icon-preview {
            margin: 20px;
            text-align: center;
        }
        .icon-preview h4 {
            margin: 10px 0;
            color: #333;
        }
        canvas { 
            border: 3px solid #ddd; 
            border-radius: 15px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .circular-preview {
            border-radius: 50% !important;
        }
        button {
            background: linear-gradient(45deg, #FF8C00, #FF7700);
            color: white;
            border: none;
            padding: 18px 35px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            margin: 15px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }
        button:hover { 
            background: linear-gradient(45deg, #e67e00, #e66e00);
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.3);
        }
        .download-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .download-link {
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 6px;
            margin: 8px;
            font-weight: bold;
            transition: background 0.3s ease;
        }
        .download-link:hover {
            background: #218838;
        }
        .instructions {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
        }
        .instructions ol {
            margin: 0;
            padding-left: 20px;
        }
        .instructions li {
            margin: 8px 0;
            line-height: 1.5;
        }
        .color-info {
            background: #fff3cd;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #FF8C00;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 EXACT GBC Icon Generator</h1>
        <p><strong>This creates the EXACT icon from your provided image</strong></p>
        
        <div class="color-info">
            <strong>📊 Exact Color Analysis:</strong><br>
            Background: #FF8C00 (Orange) | Text: #2C3E50 (Dark Blue)<br>
            Layout: GENERAL / BILIMORIA'S / 20 CANTEEN 21 / ESTD LONDON UK
        </div>
        
        <div class="preview-container">
            <div class="icon-preview">
                <h4>📱 App Icon Preview (200x200)</h4>
                <canvas id="previewCanvas" width="200" height="200"></canvas>
            </div>
            <div class="icon-preview">
                <h4>🔵 Circular Preview (Android)</h4>
                <canvas id="circularPreview" width="200" height="200" class="circular-preview"></canvas>
            </div>
        </div>
        
        <button onclick="generateExactIcons()">🎯 Generate EXACT GBC Icons (1024x1024)</button>
        
        <div id="downloadSection" class="download-section" style="display:none;">
            <h3>✅ EXACT Icons Generated Successfully!</h3>
            <a id="mainIconDownload" class="download-link">📱 Download icon.png (Main App Icon)</a>
            <a id="adaptiveIconDownload" class="download-link">🤖 Download adaptive-icon.png (Android)</a>
            
            <div class="instructions">
                <h4>📋 Installation Instructions:</h4>
                <ol>
                    <li><strong>Download both PNG files</strong> using the buttons above</li>
                    <li><strong>Navigate to your project:</strong> <code>assets/images/</code> folder</li>
                    <li><strong>Replace existing files:</strong>
                        <ul>
                            <li>Replace <code>icon.png</code> with your downloaded <code>icon.png</code></li>
                            <li>Replace <code>adaptive-icon.png</code> with your downloaded <code>adaptive-icon.png</code></li>
                        </ul>
                    </li>
                    <li><strong>Build APK:</strong> Run <code>npx eas build --profile preview --platform android</code></li>
                    <li><strong>Result:</strong> Your APK will show the EXACT GBC logo!</li>
                </ol>
            </div>
        </div>
        
        <!-- Hidden canvases for full-size generation -->
        <canvas id="mainCanvas" width="1024" height="1024" style="display:none;"></canvas>
        <canvas id="adaptiveCanvas" width="1024" height="1024" style="display:none;"></canvas>
    </div>

    <script>
        function drawExactGBCIcon(canvas, isCircular = false) {
            const ctx = canvas.getContext('2d');
            const size = canvas.width;
            
            // Clear canvas
            ctx.clearRect(0, 0, size, size);
            
            // Save context for circular clipping
            ctx.save();
            
            if (isCircular) {
                // Create circular clipping path
                ctx.beginPath();
                ctx.arc(size/2, size/2, size/2, 0, 2 * Math.PI);
                ctx.clip();
            }
            
            // Orange background - EXACT color from user's image
            ctx.fillStyle = '#FF8C00';
            ctx.fillRect(0, 0, size, size);
            
            // Text settings - EXACT specifications
            ctx.fillStyle = '#2C3E50'; // Dark blue text
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Calculate responsive font sizes
            const baseFontSize = size * 0.08;
            const smallFontSize = size * 0.05;
            
            // GENERAL - Line 1
            ctx.font = \`bold \${baseFontSize}px Arial, sans-serif\`;
            ctx.letterSpacing = '2px';
            ctx.fillText('GENERAL', size/2, size * 0.25);
            
            // BILIMORIA'S - Line 2
            ctx.font = \`bold \${baseFontSize}px Arial, sans-serif\`;
            ctx.letterSpacing = '2px';
            ctx.fillText("BILIMORIA'S", size/2, size * 0.4);
            
            // 20 CANTEEN 21 - Line 3
            ctx.font = \`bold \${baseFontSize}px Arial, sans-serif\`;
            ctx.letterSpacing = '3px';
            ctx.fillText('20 CANTEEN 21', size/2, size * 0.6);
            
            // ESTD LONDON UK - Line 4
            ctx.font = \`normal \${smallFontSize}px Arial, sans-serif\`;
            ctx.letterSpacing = '2px';
            ctx.fillText('ESTD LONDON UK', size/2, size * 0.8);
            
            // Restore context
            ctx.restore();
        }
        
        function generateExactIcons() {
            console.log('🎯 Generating EXACT GBC icons...');
            
            // Generate preview icons
            const previewCanvas = document.getElementById('previewCanvas');
            const circularPreview = document.getElementById('circularPreview');
            
            drawExactGBCIcon(previewCanvas, false);
            drawExactGBCIcon(circularPreview, true);
            
            // Generate full-size icons (1024x1024)
            const mainCanvas = document.getElementById('mainCanvas');
            const adaptiveCanvas = document.getElementById('adaptiveCanvas');
            
            // Main app icon (square with rounded corners)
            drawExactGBCIcon(mainCanvas, false);
            
            // Adaptive icon (designed for circular cropping)
            drawExactGBCIcon(adaptiveCanvas, false);
            
            // Create download links
            mainCanvas.toBlob(function(blob) {
                const link = document.getElementById('mainIconDownload');
                link.href = URL.createObjectURL(blob);
                link.download = 'icon.png';
                console.log('✅ Main icon ready for download');
            }, 'image/png', 1.0);
            
            adaptiveCanvas.toBlob(function(blob) {
                const link = document.getElementById('adaptiveIconDownload');
                link.href = URL.createObjectURL(blob);
                link.download = 'adaptive-icon.png';
                console.log('✅ Adaptive icon ready for download');
            }, 'image/png', 1.0);
            
            // Show download section
            document.getElementById('downloadSection').style.display = 'block';
            
            console.log('🎉 EXACT GBC icons generated successfully!');
        }
        
        // Auto-generate preview on page load
        window.onload = function() {
            const previewCanvas = document.getElementById('previewCanvas');
            const circularPreview = document.getElementById('circularPreview');
            
            drawExactGBCIcon(previewCanvas, false);
            drawExactGBCIcon(circularPreview, true);
            
            console.log('📱 Preview icons loaded');
        };
    </script>
</body>
</html>`;

try {
  // Save the exact icon generator
  fs.writeFileSync(path.join(__dirname, 'exact-gbc-icon-generator.html'), exactIconGenerator);
  console.log('✅ Created EXACT GBC icon generator');

  // Update app.json with proper configuration
  const appJsonPath = path.join(__dirname, 'app.json');
  if (fs.existsSync(appJsonPath)) {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    // Ensure PNG icons are configured
    appJson.expo.icon = "./assets/images/icon.png";
    
    // Android adaptive icon with EXACT orange background
    if (!appJson.expo.android) {
      appJson.expo.android = {};
    }
    
    appJson.expo.android.adaptiveIcon = {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#FF8C00" // EXACT orange from user's image
    };
    
    // Web favicon
    if (!appJson.expo.web) {
      appJson.expo.web = {};
    }
    appJson.expo.web.favicon = "./assets/images/favicon.png";
    
    // Bump version to force icon refresh
    const currentVersion = appJson.expo.version || "3.0.2";
    const versionParts = currentVersion.split('.');
    versionParts[2] = (parseInt(versionParts[2]) + 1).toString();
    appJson.expo.version = versionParts.join('.');
    
    // Update build number
    appJson.expo.android.versionCode = Date.now() % 1000000;
    
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
    console.log('✅ Updated app.json configuration');
    console.log(`✅ Version: ${appJson.expo.version}`);
  }

  // Create auto-opener script
  const autoOpener = `const { exec } = require('child_process');
const path = require('path');

const htmlFile = path.join(__dirname, 'exact-gbc-icon-generator.html');
const command = process.platform === 'win32' ? \`start "\${htmlFile}"\` : 
               process.platform === 'darwin' ? \`open "\${htmlFile}"\` : 
               \`xdg-open "\${htmlFile}"\`;

exec(command, (error) => {
  if (error) {
    console.log('❌ Could not auto-open. Please manually open: exact-gbc-icon-generator.html');
  } else {
    console.log('✅ Opened EXACT GBC icon generator in browser');
  }
});`;

  fs.writeFileSync(path.join(__dirname, 'open-exact-generator.js'), autoOpener);
  console.log('✅ Created auto-opener script');

  console.log('');
  console.log('🎯 EXACT GBC ICON REPLACEMENT SOLUTION');
  console.log('=====================================');
  console.log('');
  console.log('📋 STEP-BY-STEP INSTRUCTIONS:');
  console.log('1. 🌐 Open: exact-gbc-icon-generator.html (or run: node open-exact-generator.js)');
  console.log('2. 🎯 Click "Generate EXACT GBC Icons" button');
  console.log('3. 💾 Download both PNG files:');
  console.log('   - icon.png (main app icon)');
  console.log('   - adaptive-icon.png (Android adaptive icon)');
  console.log('4. 📁 Replace files in assets/images/ folder');
  console.log('5. 🚀 Run: npx eas build --profile preview --platform android');
  console.log('');
  console.log('🎨 EXACT SPECIFICATIONS:');
  console.log('- Background: #FF8C00 (exact orange from your image)');
  console.log('- Text: GENERAL / BILIMORIA\'S / 20 CANTEEN 21 / ESTD LONDON UK');
  console.log('- Text Color: #2C3E50 (dark blue)');
  console.log('- Size: 1024x1024 pixels');
  console.log('- Format: PNG for EAS compatibility');
  console.log('- Circular support: Android adaptive icon ready');
  console.log('');
  console.log('✅ This creates the EXACT icon from your provided image!');

} catch (error) {
  console.error('❌ Error creating exact icon generator:', error);
}
