const fs = require('fs');
const path = require('path');

console.log('🎨 Updating app icons with new GBC logo design...');

// Create SVG icons that match the reference design
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Black background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#000000"/>
  
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
const createSimpleIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Black background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#000000"/>
  
  <!-- Simplified text for small icons -->
  <text x="${size/2}" y="${size * 0.35}" font-family="Arial, sans-serif" font-size="${size * 0.12}" font-weight="bold" 
        fill="#FFFFFF" text-anchor="middle">GBC</text>
  <text x="${size/2}" y="${size * 0.65}" font-family="Arial, sans-serif" font-size="${size * 0.08}" font-weight="bold" 
        fill="#FFFFFF" text-anchor="middle">2023</text>
</svg>
`;

try {
  const assetsDir = path.join(__dirname, 'assets', 'images');
  
  // Create different sized icons
  const iconSizes = [
    { size: 1024, filename: 'icon-1024.svg', type: 'detailed' },
    { size: 512, filename: 'icon-512.svg', type: 'detailed' },
    { size: 192, filename: 'icon-192.svg', type: 'detailed' },
    { size: 144, filename: 'icon-144.svg', type: 'detailed' },
    { size: 96, filename: 'icon-96.svg', type: 'simple' },
    { size: 72, filename: 'icon-72.svg', type: 'simple' },
    { size: 48, filename: 'icon-48.svg', type: 'simple' },
    { size: 32, filename: 'icon-32.svg', type: 'simple' }
  ];
  
  iconSizes.forEach(({ size, filename, type }) => {
    const svgContent = type === 'detailed' ? createIconSVG(size) : createSimpleIconSVG(size);
    fs.writeFileSync(path.join(assetsDir, filename), svgContent.trim());
    console.log(`✅ Created ${filename} (${size}x${size})`);
  });
  
  // Update the main icon files with the new design
  const mainIconSVG = createIconSVG(512);
  const adaptiveIconSVG = createIconSVG(1024);
  const faviconSVG = createSimpleIconSVG(32);
  
  fs.writeFileSync(path.join(assetsDir, 'icon.svg'), mainIconSVG.trim());
  fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.svg'), adaptiveIconSVG.trim());
  fs.writeFileSync(path.join(assetsDir, 'favicon.svg'), faviconSVG.trim());
  
  console.log('\n✅ Updated main icon files:');
  console.log('   - assets/images/icon.svg (512x512)');
  console.log('   - assets/images/adaptive-icon.svg (1024x1024)');
  console.log('   - assets/images/favicon.svg (32x32)');
  
  // Create an HTML file to convert SVGs to PNGs
  const converterHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>GBC Icon Converter</title>
    <style>
        body { margin: 0; padding: 20px; background: #f0f0f0; font-family: Arial, sans-serif; }
        .icon-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .icon-item { text-align: center; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .icon-preview { margin: 10px 0; }
        canvas { border: 1px solid #ddd; margin: 5px; }
        button { background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <h1>🎨 GBC Icon Converter</h1>
    <p>Convert SVG icons to PNG format for app deployment</p>
    
    <div class="icon-grid">
        <div class="icon-item">
            <h3>App Icon (512x512)</h3>
            <div class="icon-preview">${mainIconSVG}</div>
            <canvas id="icon-canvas" width="512" height="512"></canvas>
            <br><button onclick="downloadIcon('icon')">Download PNG</button>
        </div>
        
        <div class="icon-item">
            <h3>Adaptive Icon (1024x1024)</h3>
            <div class="icon-preview">${adaptiveIconSVG}</div>
            <canvas id="adaptive-canvas" width="1024" height="1024"></canvas>
            <br><button onclick="downloadIcon('adaptive')">Download PNG</button>
        </div>
        
        <div class="icon-item">
            <h3>Favicon (32x32)</h3>
            <div class="icon-preview">${faviconSVG}</div>
            <canvas id="favicon-canvas" width="32" height="32"></canvas>
            <br><button onclick="downloadIcon('favicon')">Download PNG</button>
        </div>
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
            let svg, canvas, filename;
            
            switch(type) {
                case 'icon':
                    svg = document.querySelector('.icon-item:nth-child(1) svg');
                    canvas = document.getElementById('icon-canvas');
                    filename = 'icon.png';
                    break;
                case 'adaptive':
                    svg = document.querySelector('.icon-item:nth-child(2) svg');
                    canvas = document.getElementById('adaptive-canvas');
                    filename = 'adaptive-icon.png';
                    break;
                case 'favicon':
                    svg = document.querySelector('.icon-item:nth-child(3) svg');
                    canvas = document.getElementById('favicon-canvas');
                    filename = 'favicon.png';
                    break;
            }
            
            if (svg && canvas) {
                await svgToPng(svg, canvas);
                downloadCanvas(canvas, filename);
            }
        }
        
        // Auto-generate previews on load
        window.onload = async function() {
            const icons = ['icon', 'adaptive', 'favicon'];
            for (const icon of icons) {
                await downloadIcon(icon);
            }
        };
    </script>
</body>
</html>
`;

  fs.writeFileSync(path.join(__dirname, 'gbc-icon-converter.html'), converterHTML);
  
  console.log('\n✅ Created icon converter: gbc-icon-converter.html');
  console.log('   Open this file in a browser to generate PNG versions');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Open gbc-icon-converter.html in a web browser');
  console.log('2. Download the PNG files (icon.png, adaptive-icon.png, favicon.png)');
  console.log('3. Replace the existing PNG files in assets/images/');
  console.log('4. Test the app to ensure icons display correctly');
  
} catch (error) {
  console.error('❌ Error updating app icons:', error);
}
