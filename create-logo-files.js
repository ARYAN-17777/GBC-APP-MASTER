const fs = require('fs');
const path = require('path');

console.log('🎨 Creating logo files based on your exact specifications...');

// Create an SVG version of the logo with orange background that matches your reference
const createLogoSVG = (size, isIcon = false) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2;
  
  // Font sizes based on the size
  const generalFontSize = size * 0.04;
  const bilimoriaFontSize = size * 0.06;
  const canteenFontSize = size * 0.05;
  const estdFontSize = size * 0.025;
  const yearFontSize = size * 0.04;
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Orange background circle -->
  <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="#F77F00"/>
  
  <!-- GENERAL text (curved at top) -->
  <path id="top-curve-${size}" d="M ${size * 0.15} ${centerY} A ${size * 0.35} ${size * 0.35} 0 0 1 ${size * 0.85} ${centerY}" fill="none"/>
  <text font-family="Arial, sans-serif" font-size="${generalFontSize}" font-weight="bold" fill="#FFFFFF" letter-spacing="${size * 0.002}">
    <textPath href="#top-curve-${size}" startOffset="50%" text-anchor="middle">GENERAL</textPath>
  </text>
  
  <!-- BILIMORIA'S text (main center) -->
  <text x="${centerX}" y="${centerY - size * 0.02}" font-family="Arial, sans-serif" font-size="${bilimoriaFontSize}" font-weight="bold" 
        fill="#FFFFFF" text-anchor="middle" letter-spacing="${size * 0.001}">BILIMORIA'S</text>
  
  <!-- 20 CANTEEN 23 text (center) -->
  <g>
    <text x="${centerX - size * 0.12}" y="${centerY + size * 0.08}" font-family="Arial, sans-serif" font-size="${yearFontSize}" font-weight="bold" 
          fill="#FFFFFF" text-anchor="middle">20</text>
    <text x="${centerX}" y="${centerY + size * 0.08}" font-family="Arial, sans-serif" font-size="${canteenFontSize}" font-weight="bold" 
          fill="#FFFFFF" text-anchor="middle" letter-spacing="${size * 0.003}">CANTEEN</text>
    <text x="${centerX + size * 0.12}" y="${centerY + size * 0.08}" font-family="Arial, sans-serif" font-size="${yearFontSize}" font-weight="bold" 
          fill="#FFFFFF" text-anchor="middle">23</text>
  </g>
  
  <!-- ESTD. LONDON, UK text (curved at bottom) -->
  <path id="bottom-curve-${size}" d="M ${size * 0.85} ${centerY} A ${size * 0.35} ${size * 0.35} 0 0 1 ${size * 0.15} ${centerY}" fill="none"/>
  <text font-family="Arial, sans-serif" font-size="${estdFontSize}" font-weight="normal" fill="#FFFFFF" letter-spacing="${size * 0.001}">
    <textPath href="#bottom-curve-${size}" startOffset="50%" text-anchor="middle">ESTD. LONDON, UK</textPath>
  </text>
</svg>`;
};

// Create simplified version for small icons
const createSimpleIconSVG = (size) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2;
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Orange background circle -->
  <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="#F77F00"/>
  
  <!-- Simplified text for small icons -->
  <text x="${centerX}" y="${centerY - size * 0.1}" font-family="Arial, sans-serif" font-size="${size * 0.12}" font-weight="bold" 
        fill="#FFFFFF" text-anchor="middle">GBC</text>
  <text x="${centerX}" y="${centerY + size * 0.15}" font-family="Arial, sans-serif" font-size="${size * 0.08}" font-weight="bold" 
        fill="#FFFFFF" text-anchor="middle">2023</text>
</svg>`;
};

try {
  const assetsDir = path.join(__dirname, 'assets', 'images');
  
  // Create the main logo SVG for home page (200x200)
  const homeLogo = createLogoSVG(200);
  fs.writeFileSync(path.join(assetsDir, 'gbc-logo.svg'), homeLogo);
  
  // Create app icon SVGs
  const iconSizes = [
    { size: 512, filename: 'icon.svg', simple: false },
    { size: 1024, filename: 'adaptive-icon.svg', simple: false },
    { size: 32, filename: 'favicon.svg', simple: true }
  ];
  
  iconSizes.forEach(({ size, filename, simple }) => {
    const svgContent = simple ? createSimpleIconSVG(size) : createLogoSVG(size, true);
    fs.writeFileSync(path.join(assetsDir, filename), svgContent);
    console.log(`✅ Created ${filename} (${size}x${size})`);
  });
  
  console.log('✅ Created gbc-logo.svg for home page (200x200)');
  
  // Create HTML converter for PNG generation
  const converterHTML = `<!DOCTYPE html>
<html>
<head>
    <title>GBC Logo to PNG Converter</title>
    <style>
        body { margin: 0; padding: 20px; background: #f0f0f0; font-family: Arial, sans-serif; }
        .converter { margin: 20px 0; text-align: center; }
        canvas { border: 1px solid #ddd; margin: 10px; }
        button { background: #F77F00; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
        button:hover { background: #e66f00; }
        .logo-preview { margin: 10px; }
    </style>
</head>
<body>
    <h1>🎨 GBC Logo PNG Converter</h1>
    <p>Convert SVG logos to PNG format with orange background (#F77F00)</p>
    
    <div class="converter">
        <h3>Home Page Logo (200x200)</h3>
        <div class="logo-preview">${homeLogo}</div>
        <canvas id="home-canvas" width="200" height="200"></canvas>
        <br><button onclick="convertToPNG('home', 200, 'gbc-logo.png')">Download gbc-logo.png</button>
    </div>
    
    <div class="converter">
        <h3>App Icon (512x512)</h3>
        <div class="logo-preview">${createLogoSVG(512, true)}</div>
        <canvas id="icon-canvas" width="512" height="512"></canvas>
        <br><button onclick="convertToPNG('icon', 512, 'icon.png')">Download icon.png</button>
    </div>
    
    <div class="converter">
        <h3>Adaptive Icon (1024x1024)</h3>
        <canvas id="adaptive-canvas" width="1024" height="1024"></canvas>
        <br><button onclick="convertToPNG('adaptive', 1024, 'adaptive-icon.png')">Download adaptive-icon.png</button>
    </div>
    
    <div class="converter">
        <h3>Favicon (32x32)</h3>
        <div class="logo-preview">${createSimpleIconSVG(32)}</div>
        <canvas id="favicon-canvas" width="32" height="32"></canvas>
        <br><button onclick="convertToPNG('favicon', 32, 'favicon.png')">Download favicon.png</button>
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
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
        
        async function convertToPNG(type, size, filename) {
            let svg, canvas;
            
            switch(type) {
                case 'home':
                    svg = document.querySelector('.converter:nth-child(2) svg');
                    canvas = document.getElementById('home-canvas');
                    break;
                case 'icon':
                    svg = document.querySelector('.converter:nth-child(3) svg');
                    canvas = document.getElementById('icon-canvas');
                    break;
                case 'adaptive':
                    // Create adaptive icon SVG
                    const adaptiveSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    adaptiveSvg.innerHTML = '${createLogoSVG(1024, true).replace(/'/g, "\\'")}';
                    document.body.appendChild(adaptiveSvg);
                    svg = adaptiveSvg;
                    canvas = document.getElementById('adaptive-canvas');
                    break;
                case 'favicon':
                    svg = document.querySelector('.converter:nth-child(5) svg');
                    canvas = document.getElementById('favicon-canvas');
                    break;
            }
            
            if (svg && canvas) {
                await svgToPng(svg, canvas);
                downloadCanvas(canvas, filename);
                
                if (type === 'adaptive') {
                    document.body.removeChild(svg);
                }
            }
        }
        
        // Auto-generate previews on load
        window.onload = async function() {
            console.log('Ready to convert logos to PNG format');
        };
    </script>
</body>
</html>`;

  fs.writeFileSync(path.join(__dirname, 'logo-png-converter.html'), converterHTML);
  
  console.log('\n✅ Created logo-png-converter.html');
  console.log('   Open this file in a browser to generate PNG versions');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Open logo-png-converter.html in a browser');
  console.log('2. Download the PNG files for home page and app icons');
  console.log('3. The logos have orange background (#F77F00) as specified');
  console.log('4. All text is white (#FFFFFF) matching your reference');
  
} catch (error) {
  console.error('❌ Error creating logo files:', error);
}
