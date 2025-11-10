const fs = require('fs');
const path = require('path');

console.log('🎨 Creating new GBC logo assets based on reference design...');

// Create the new logo as an SVG that matches the reference image design
const newLogoSVG = `
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Black background circle -->
  <circle cx="100" cy="100" r="100" fill="#000000"/>
  
  <!-- GENERAL text (curved at top) -->
  <path id="top-curve" d="M 30 100 A 70 70 0 0 1 170 100" fill="none"/>
  <text font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#FFFFFF" letter-spacing="2">
    <textPath href="#top-curve" startOffset="50%" text-anchor="middle">GENERAL</textPath>
  </text>
  
  <!-- BILIMORIA'S text (main center) -->
  <text x="100" y="90" font-family="Arial, sans-serif" font-size="20" font-weight="bold" 
        fill="#FFFFFF" text-anchor="middle" letter-spacing="1">BILIMORIA'S</text>
  
  <!-- 20 CANTEEN 23 text (center) -->
  <g>
    <text x="70" y="115" font-family="Arial, sans-serif" font-size="14" font-weight="bold" 
          fill="#FFFFFF" text-anchor="middle">20</text>
    <text x="100" y="115" font-family="Arial, sans-serif" font-size="16" font-weight="bold" 
          fill="#FFFFFF" text-anchor="middle" letter-spacing="2">CANTEEN</text>
    <text x="130" y="115" font-family="Arial, sans-serif" font-size="14" font-weight="bold" 
          fill="#FFFFFF" text-anchor="middle">23</text>
  </g>
  
  <!-- ESTD. LONDON, UK text (curved at bottom) -->
  <path id="bottom-curve" d="M 170 100 A 70 70 0 0 1 30 100" fill="none"/>
  <text font-family="Arial, sans-serif" font-size="12" font-weight="normal" fill="#FFFFFF" letter-spacing="1">
    <textPath href="#bottom-curve" startOffset="50%" text-anchor="middle">ESTD. LONDON, UK</textPath>
  </text>
</svg>
`;

// Create a simpler version for small icons
const iconLogoSVG = `
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Black background circle -->
  <circle cx="100" cy="100" r="100" fill="#000000"/>
  
  <!-- Simplified text for icon -->
  <text x="100" y="80" font-family="Arial, sans-serif" font-size="18" font-weight="bold" 
        fill="#FFFFFF" text-anchor="middle" letter-spacing="1">GENERAL</text>
  <text x="100" y="105" font-family="Arial, sans-serif" font-size="20" font-weight="bold" 
        fill="#FFFFFF" text-anchor="middle" letter-spacing="1">BILIMORIA'S</text>
  <text x="100" y="130" font-family="Arial, sans-serif" font-size="16" font-weight="bold" 
        fill="#FFFFFF" text-anchor="middle" letter-spacing="2">CANTEEN</text>
</svg>
`;

// Create HTML file to generate PNG versions
const htmlGenerator = `
<!DOCTYPE html>
<html>
<head>
    <title>GBC Logo Generator</title>
    <style>
        body { margin: 0; padding: 20px; background: #f0f0f0; }
        .logo-container { margin: 20px 0; text-align: center; }
        .logo { margin: 10px; }
        canvas { border: 1px solid #ccc; margin: 10px; }
    </style>
</head>
<body>
    <h1>GBC Logo Generator</h1>
    
    <div class="logo-container">
        <h2>Home Page Logo (200x200)</h2>
        <div id="home-logo" class="logo">${newLogoSVG}</div>
        <canvas id="home-canvas" width="200" height="200"></canvas>
        <br>
        <button onclick="downloadHomeLogo()">Download Home Logo PNG</button>
    </div>
    
    <div class="logo-container">
        <h2>App Icon Logo (512x512)</h2>
        <div id="icon-logo" class="logo">${iconLogoSVG}</div>
        <canvas id="icon-canvas" width="512" height="512"></canvas>
        <br>
        <button onclick="downloadIconLogo()">Download Icon Logo PNG</button>
    </div>
    
    <div class="logo-container">
        <h2>Adaptive Icon Logo (1024x1024)</h2>
        <canvas id="adaptive-canvas" width="1024" height="1024"></canvas>
        <br>
        <button onclick="downloadAdaptiveLogo()">Download Adaptive Icon PNG</button>
    </div>

    <script>
        function svgToPng(svgElement, canvas, scale = 1) {
            const ctx = canvas.getContext('2d');
            const data = new XMLSerializer().serializeToString(svgElement);
            const img = new Image();
            
            return new Promise((resolve) => {
                img.onload = function() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve();
                };
                img.src = 'data:image/svg+xml;base64,' + btoa(data);
            });
        }
        
        function downloadCanvas(canvas, filename) {
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL();
            link.click();
        }
        
        async function downloadHomeLogo() {
            const svg = document.querySelector('#home-logo svg');
            const canvas = document.getElementById('home-canvas');
            await svgToPng(svg, canvas);
            downloadCanvas(canvas, 'gbc-home-logo.png');
        }
        
        async function downloadIconLogo() {
            const svg = document.querySelector('#icon-logo svg');
            const canvas = document.getElementById('icon-canvas');
            await svgToPng(svg, canvas);
            downloadCanvas(canvas, 'gbc-icon-512.png');
        }
        
        async function downloadAdaptiveLogo() {
            const svg = document.querySelector('#icon-logo svg');
            const canvas = document.getElementById('adaptive-canvas');
            await svgToPng(svg, canvas);
            downloadCanvas(canvas, 'gbc-adaptive-icon-1024.png');
        }
        
        // Auto-generate canvases on load
        window.onload = async function() {
            await downloadHomeLogo();
            await downloadIconLogo();
            await downloadAdaptiveLogo();
        };
    </script>
</body>
</html>
`;

try {
  // Save SVG files
  const assetsDir = path.join(__dirname, 'assets', 'images');
  
  // Create new logo SVG files
  fs.writeFileSync(path.join(assetsDir, 'gbc-new-logo.svg'), newLogoSVG.trim());
  fs.writeFileSync(path.join(assetsDir, 'gbc-new-icon.svg'), iconLogoSVG.trim());
  
  // Create HTML generator
  fs.writeFileSync(path.join(__dirname, 'gbc-new-logo-generator.html'), htmlGenerator);
  
  console.log('✅ Created new GBC logo SVG files:');
  console.log('   - assets/images/gbc-new-logo.svg (for home page)');
  console.log('   - assets/images/gbc-new-icon.svg (for app icons)');
  console.log('   - gbc-new-logo-generator.html (to generate PNG files)');
  
  console.log('\n📋 Next steps:');
  console.log('1. Open gbc-new-logo-generator.html in a web browser');
  console.log('2. Download the generated PNG files');
  console.log('3. Replace the existing logo files with the new ones');
  
} catch (error) {
  console.error('❌ Error creating logo files:', error);
}
