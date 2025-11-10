const fs = require('fs');
const path = require('path');

console.log('🎨 Creating orange app icons with updated design...');

// Create the orange logo SVG for different sizes
const createOrangeIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Orange background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#F77F00"/>
  
  <!-- GENERAL text (top) -->
  <text x="${size/2}" y="${size * 0.25}" font-family="Arial, sans-serif" font-size="${size * 0.08}" font-weight="bold" 
        fill="#FFFFFF" text-anchor="middle" letter-spacing="${size * 0.005}">GENERAL</text>
  
  <!-- BILIMORIA'S text (main center) -->
  <text x="${size/2}" y="${size * 0.4}" font-family="Arial, sans-serif" font-size="${size * 0.09}" font-weight="bold" 
        fill="#FFFFFF" text-anchor="middle" letter-spacing="${size * 0.003}">BILIMORIA'S</text>
  
  <!-- 20 CANTEEN 23 text (center) -->
  <g>
    <text x="${size * 0.35}" y="${size * 0.55}" font-family="Arial, sans-serif" font-size="${size * 0.07}" font-weight="bold" 
          fill="#FFFFFF" text-anchor="middle">20</text>
    <text x="${size/2}" y="${size * 0.55}" font-family="Arial, sans-serif" font-size="${size * 0.08}" font-weight="bold" 
          fill="#FFFFFF" text-anchor="middle" letter-spacing="${size * 0.008}">CANTEEN</text>
    <text x="${size * 0.65}" y="${size * 0.55}" font-family="Arial, sans-serif" font-size="${size * 0.07}" font-weight="bold" 
          fill="#FFFFFF" text-anchor="middle">23</text>
  </g>
  
  <!-- ESTD. LONDON, UK text (bottom) -->
  <text x="${size/2}" y="${size * 0.75}" font-family="Arial, sans-serif" font-size="${size * 0.05}" font-weight="normal" 
        fill="#FFFFFF" text-anchor="middle" letter-spacing="${size * 0.003}">ESTD. LONDON, UK</text>
</svg>
`;

// Create simplified icon for very small sizes
const createSimpleOrangeIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Orange background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#F77F00"/>
  
  <!-- Simplified text for small icons -->
  <text x="${size/2}" y="${size * 0.35}" font-family="Arial, sans-serif" font-size="${size * 0.12}" font-weight="bold" 
        fill="#FFFFFF" text-anchor="middle">GBC</text>
  <text x="${size/2}" y="${size * 0.65}" font-family="Arial, sans-serif" font-size="${size * 0.08}" font-weight="bold" 
        fill="#FFFFFF" text-anchor="middle">2023</text>
</svg>
`;

try {
  const assetsDir = path.join(__dirname, 'assets', 'images');
  
  // Create the main icon files with orange background
  const mainIconSVG = createOrangeIconSVG(512);
  const adaptiveIconSVG = createOrangeIconSVG(1024);
  const faviconSVG = createSimpleOrangeIconSVG(32);
  
  // Update the main icon files
  fs.writeFileSync(path.join(assetsDir, 'icon.svg'), mainIconSVG.trim());
  fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.svg'), adaptiveIconSVG.trim());
  fs.writeFileSync(path.join(assetsDir, 'favicon.svg'), faviconSVG.trim());
  
  console.log('✅ Updated main icon files with orange background:');
  console.log('   - assets/images/icon.svg (512x512)');
  console.log('   - assets/images/adaptive-icon.svg (1024x1024)');
  console.log('   - assets/images/favicon.svg (32x32)');
  
  // Create an HTML file to convert SVGs to PNGs with orange background
  const converterHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>GBC Orange Icon Converter</title>
    <style>
        body { margin: 0; padding: 20px; background: #f0f0f0; font-family: Arial, sans-serif; }
        .header { text-align: center; margin-bottom: 30px; }
        .icon-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .icon-item { text-align: center; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .icon-preview { margin: 15px 0; }
        canvas { border: 1px solid #ddd; margin: 10px; }
        button { background: #F77F00; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
        button:hover { background: #e66f00; }
        .preview-svg { width: 100px; height: 100px; }
        .success { color: #28a745; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨 GBC Orange Icon Converter</h1>
        <p>Convert SVG icons to PNG format with orange background (#F77F00)</p>
    </div>
    
    <div class="icon-grid">
        <div class="icon-item">
            <h3>App Icon (512x512)</h3>
            <div class="icon-preview">${mainIconSVG}</div>
            <canvas id="icon-canvas" width="512" height="512"></canvas>
            <br><button onclick="downloadIcon('icon')">Download icon.png</button>
            <div id="icon-status"></div>
        </div>
        
        <div class="icon-item">
            <h3>Adaptive Icon (1024x1024)</h3>
            <div class="icon-preview">${adaptiveIconSVG}</div>
            <canvas id="adaptive-canvas" width="1024" height="1024"></canvas>
            <br><button onclick="downloadIcon('adaptive')">Download adaptive-icon.png</button>
            <div id="adaptive-status"></div>
        </div>
        
        <div class="icon-item">
            <h3>Favicon (32x32)</h3>
            <div class="icon-preview">${faviconSVG}</div>
            <canvas id="favicon-canvas" width="32" height="32"></canvas>
            <br><button onclick="downloadIcon('favicon')">Download favicon.png</button>
            <div id="favicon-status"></div>
        </div>
    </div>

    <div style="margin-top: 30px; text-align: center; background: white; padding: 20px; border-radius: 8px;">
        <h3>📋 Instructions</h3>
        <p>1. Click each download button to generate PNG files</p>
        <p>2. Replace the existing PNG files in assets/images/ with the downloaded files</p>
        <p>3. The icons now have orange background (#F77F00) instead of black</p>
        <p>4. Build your app to see the new orange icons</p>
    </div>

    <script>
        function svgToPng(svgElement, canvas) {
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
        
        async function downloadIcon(type) {
            let svg, canvas, filename, statusDiv;
            
            switch(type) {
                case 'icon':
                    svg = document.querySelector('.icon-item:nth-child(1) svg');
                    canvas = document.getElementById('icon-canvas');
                    filename = 'icon.png';
                    statusDiv = document.getElementById('icon-status');
                    break;
                case 'adaptive':
                    svg = document.querySelector('.icon-item:nth-child(2) svg');
                    canvas = document.getElementById('adaptive-canvas');
                    filename = 'adaptive-icon.png';
                    statusDiv = document.getElementById('adaptive-status');
                    break;
                case 'favicon':
                    svg = document.querySelector('.icon-item:nth-child(3) svg');
                    canvas = document.getElementById('favicon-canvas');
                    filename = 'favicon.png';
                    statusDiv = document.getElementById('favicon-status');
                    break;
            }
            
            if (svg && canvas) {
                statusDiv.innerHTML = 'Generating...';
                await svgToPng(svg, canvas);
                downloadCanvas(canvas, filename);
                statusDiv.innerHTML = '<span class="success">✅ Downloaded!</span>';
            }
        }
        
        // Auto-generate previews on load
        window.onload = async function() {
            console.log('Orange icon converter loaded successfully!');
        };
    </script>
</body>
</html>
`;

  fs.writeFileSync(path.join(__dirname, 'orange-icon-converter.html'), converterHTML);
  
  console.log('\n✅ Created orange icon converter: orange-icon-converter.html');
  console.log('   Open this file in a browser to generate PNG versions');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Open orange-icon-converter.html in a web browser');
  console.log('2. Download the PNG files (icon.png, adaptive-icon.png, favicon.png)');
  console.log('3. Replace the existing PNG files in assets/images/');
  console.log('4. The new icons will have orange background (#F77F00) instead of black');
  
} catch (error) {
  console.error('❌ Error creating orange app icons:', error);
}

console.log('\n🎯 Summary:');
console.log('✅ Updated SVG files with orange background');
console.log('✅ Created HTML converter for PNG generation');
console.log('✅ Icons now match the home page logo color scheme');
console.log('🚀 Ready to generate PNG files and build the app!');
