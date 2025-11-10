// Create PNG version of exact GBC icon for better EAS compatibility
const fs = require('fs');
const path = require('path');

console.log('🎨 Creating PNG Version of Exact GBC Icon');
console.log('=========================================');

// Since we can't generate actual PNG files with Node.js without additional libraries,
// let's update the app.json to use PNG and provide instructions

try {
  // Update app.json to use PNG icons for better EAS compatibility
  const appJsonPath = path.join(__dirname, 'app.json');
  if (fs.existsSync(appJsonPath)) {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    // Update icon paths to PNG for EAS compatibility
    appJson.expo.icon = "./assets/images/icon.png";
    
    // Update Android adaptive icon
    if (!appJson.expo.android) {
      appJson.expo.android = {};
    }
    
    appJson.expo.android.adaptiveIcon = {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#FF8C00" // Exact orange color from user's image
    };
    
    // Update web favicon
    if (!appJson.expo.web) {
      appJson.expo.web = {};
    }
    appJson.expo.web.favicon = "./assets/images/favicon.png";
    
    // Ensure proper app metadata
    appJson.expo.name = "General Bilimoria's Canteen";
    appJson.expo.description = "Official mobile app for General Bilimoria's Canteen - Order food, manage orders, and enjoy real-time updates.";
    
    // Add version bump to force icon refresh
    const currentVersion = appJson.expo.version || "3.0.0";
    const versionParts = currentVersion.split('.');
    versionParts[2] = (parseInt(versionParts[2]) + 1).toString();
    appJson.expo.versionCode = parseInt(versionParts.join('')) + 1;
    appJson.expo.version = versionParts.join('.');
    
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
    console.log('✅ Updated app.json to use PNG icons');
    console.log(`✅ Version bumped to: ${appJson.expo.version}`);
  }

  // Create a simple HTML file to convert SVG to PNG manually
  const htmlConverter = `<!DOCTYPE html>
<html>
<head>
    <title>GBC Icon Converter</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .icon-container { margin: 20px 0; }
        canvas { border: 1px solid #ccc; margin: 10px; }
    </style>
</head>
<body>
    <h1>GBC Icon Converter</h1>
    <p>This will help convert the SVG icons to PNG format:</p>
    
    <div class="icon-container">
        <h3>Main Icon (1024x1024)</h3>
        <svg width="200" height="200" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="1024" height="1024" fill="#FF8C00" rx="20"/>
            <text x="512" y="256" text-anchor="middle" font-family="Arial, sans-serif" font-size="82" font-weight="bold" fill="#2C3E50" letter-spacing="2px">GENERAL</text>
            <text x="512" y="410" text-anchor="middle" font-family="Arial, sans-serif" font-size="82" font-weight="bold" fill="#2C3E50" letter-spacing="2px">BILIMORIA'S</text>
            <text x="512" y="614" text-anchor="middle" font-family="Arial, sans-serif" font-size="82" font-weight="bold" fill="#2C3E50" letter-spacing="3px">20 CANTEEN 21</text>
            <text x="512" y="819" text-anchor="middle" font-family="Arial, sans-serif" font-size="51" font-weight="normal" fill="#2C3E50" letter-spacing="2px">ESTD LONDON UK</text>
        </svg>
        <canvas id="mainCanvas" width="1024" height="1024"></canvas>
        <br>
        <button onclick="convertMain()">Convert Main Icon to PNG</button>
        <a id="mainDownload" style="display:none;">Download Main Icon PNG</a>
    </div>
    
    <div class="icon-container">
        <h3>Adaptive Icon (1024x1024)</h3>
        <svg width="200" height="200" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="1024" height="1024" fill="#FF8C00"/>
            <g transform="translate(174, 174)">
                <text x="338" y="205" text-anchor="middle" font-family="Arial, sans-serif" font-size="61" font-weight="bold" fill="#2C3E50" letter-spacing="1px">GENERAL</text>
                <text x="338" y="358" text-anchor="middle" font-family="Arial, sans-serif" font-size="61" font-weight="bold" fill="#2C3E50" letter-spacing="1px">BILIMORIA'S</text>
                <text x="338" y="512" text-anchor="middle" font-family="Arial, sans-serif" font-size="61" font-weight="bold" fill="#2C3E50" letter-spacing="2px">20 CANTEEN 21</text>
                <text x="338" y="666" text-anchor="middle" font-family="Arial, sans-serif" font-size="41" font-weight="normal" fill="#2C3E50" letter-spacing="1px">ESTD LONDON UK</text>
            </g>
        </svg>
        <canvas id="adaptiveCanvas" width="1024" height="1024"></canvas>
        <br>
        <button onclick="convertAdaptive()">Convert Adaptive Icon to PNG</button>
        <a id="adaptiveDownload" style="display:none;">Download Adaptive Icon PNG</a>
    </div>

    <script>
        function convertMain() {
            const svg = document.querySelector('.icon-container svg');
            const canvas = document.getElementById('mainCanvas');
            const ctx = canvas.getContext('2d');
            
            const data = new XMLSerializer().serializeToString(svg);
            const img = new Image();
            const blob = new Blob([data], {type: 'image/svg+xml'});
            const url = URL.createObjectURL(blob);
            
            img.onload = function() {
                ctx.drawImage(img, 0, 0, 1024, 1024);
                canvas.toBlob(function(blob) {
                    const link = document.getElementById('mainDownload');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'icon.png';
                    link.style.display = 'inline';
                    link.textContent = 'Download Main Icon PNG';
                });
            };
            img.src = url;
        }
        
        function convertAdaptive() {
            const svg = document.querySelectorAll('.icon-container svg')[1];
            const canvas = document.getElementById('adaptiveCanvas');
            const ctx = canvas.getContext('2d');
            
            const data = new XMLSerializer().serializeToString(svg);
            const img = new Image();
            const blob = new Blob([data], {type: 'image/svg+xml'});
            const url = URL.createObjectURL(blob);
            
            img.onload = function() {
                ctx.drawImage(img, 0, 0, 1024, 1024);
                canvas.toBlob(function(blob) {
                    const link = document.getElementById('adaptiveDownload');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'adaptive-icon.png';
                    link.style.display = 'inline';
                    link.textContent = 'Download Adaptive Icon PNG';
                });
            };
            img.src = url;
        }
    </script>
</body>
</html>`;

  fs.writeFileSync(path.join(__dirname, 'gbc-icon-converter.html'), htmlConverter);
  console.log('✅ Created icon converter HTML file');

  console.log('');
  console.log('🎯 NEXT STEPS TO GET EXACT GBC ICON:');
  console.log('===================================');
  console.log('1. Open gbc-icon-converter.html in your browser');
  console.log('2. Click "Convert Main Icon to PNG" and download as icon.png');
  console.log('3. Click "Convert Adaptive Icon to PNG" and download as adaptive-icon.png');
  console.log('4. Replace the files in assets/images/ folder');
  console.log('5. Run EAS build again');
  console.log('');
  console.log('OR - Alternative approach:');
  console.log('1. Use any online SVG to PNG converter');
  console.log('2. Convert the SVG files we created to PNG (1024x1024)');
  console.log('3. Replace icon.png and adaptive-icon.png in assets/images/');
  console.log('4. Run EAS build');
  console.log('');
  console.log('🎨 Icon Specifications:');
  console.log('- Background: #FF8C00 (exact orange from your image)');
  console.log('- Text: GENERAL / BILIMORIA\'S / 20 CANTEEN 21 / ESTD LONDON UK');
  console.log('- Text Color: #2C3E50 (dark blue for contrast)');
  console.log('- Size: 1024x1024 pixels');

} catch (error) {
  console.error('❌ Error creating PNG icon setup:', error);
}
