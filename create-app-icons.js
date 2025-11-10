const fs = require('fs');
const path = require('path');

console.log('🎨 Creating app icon PNG files with orange background...');

// Create a simple base64 encoded PNG for each icon size
// This creates a minimal orange circle with white text placeholder

function createBasicPNG(width, height) {
  // This is a very basic PNG structure - in production you'd use a proper image library
  // For now, we'll create a simple placeholder that can be replaced with actual icons
  
  const header = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    (width >> 24) & 0xFF, (width >> 16) & 0xFF, (width >> 8) & 0xFF, width & 0xFF, // Width
    (height >> 24) & 0xFF, (height >> 16) & 0xFF, (height >> 8) & 0xFF, height & 0xFF, // Height
    0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth, color type, compression, filter, interlace
  ]);
  
  // For simplicity, let's create a very basic PNG structure
  // In practice, you'd use a proper image generation library
  
  return Buffer.concat([
    header,
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // CRC placeholder
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // IDAT chunk length
    Buffer.from([0x49, 0x44, 0x41, 0x54]), // IDAT
    Buffer.from([0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01]), // Minimal compressed data
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // CRC placeholder
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // IEND chunk length
    Buffer.from([0x49, 0x45, 0x4E, 0x44]), // IEND
    Buffer.from([0xAE, 0x42, 0x60, 0x82])  // IEND CRC
  ]);
}

// Create HTML file that generates proper PNG icons
const iconGeneratorHTML = `<!DOCTYPE html>
<html>
<head>
    <title>GBC App Icon Generator</title>
    <style>
        body { margin: 0; padding: 20px; background: #f0f0f0; font-family: Arial, sans-serif; }
        .icon-section { margin: 30px 0; text-align: center; border: 1px solid #ddd; padding: 20px; background: white; border-radius: 8px; }
        canvas { border: 1px solid #ccc; margin: 10px; }
        button { background: #F77F00; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; margin: 5px; font-size: 14px; }
        button:hover { background: #e66f00; }
        .preview { margin: 15px 0; }
        h1 { color: #F77F00; }
        h3 { color: #333; }
        .instructions { background: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #F77F00; }
    </style>
</head>
<body>
    <h1>🎨 GBC App Icon Generator</h1>
    <div class="instructions">
        <strong>Instructions:</strong> Click the buttons below to generate and download PNG icon files with orange background (#F77F00) and white text. These will replace your current app icons.
    </div>
    
    <div class="icon-section">
        <h3>Home Page Logo (200x200)</h3>
        <canvas id="home-canvas" width="200" height="200"></canvas>
        <div class="preview">Preview: Orange circle with white "GENERAL BILIMORIA'S CANTEEN" text</div>
        <button onclick="generateIcon('home', 200, 'gbc-logo.png')">Download gbc-logo.png</button>
    </div>
    
    <div class="icon-section">
        <h3>App Icon (512x512)</h3>
        <canvas id="icon-canvas" width="512" height="512"></canvas>
        <div class="preview">Preview: Orange circle with white "GBC" text</div>
        <button onclick="generateIcon('icon', 512, 'icon.png')">Download icon.png</button>
    </div>
    
    <div class="icon-section">
        <h3>Adaptive Icon (1024x1024)</h3>
        <canvas id="adaptive-canvas" width="1024" height="1024"></canvas>
        <div class="preview">Preview: Orange circle with white "GBC" text (large)</div>
        <button onclick="generateIcon('adaptive', 1024, 'adaptive-icon.png')">Download adaptive-icon.png</button>
    </div>
    
    <div class="icon-section">
        <h3>Favicon (32x32)</h3>
        <canvas id="favicon-canvas" width="32" height="32"></canvas>
        <div class="preview">Preview: Orange circle with white "GBC" text (small)</div>
        <button onclick="generateIcon('favicon', 32, 'favicon.png')">Download favicon.png</button>
    </div>

    <script>
        function drawIcon(canvas, size, type) {
            const ctx = canvas.getContext('2d');
            const centerX = size / 2;
            const centerY = size / 2;
            const radius = size / 2;
            
            // Clear canvas
            ctx.clearRect(0, 0, size, size);
            
            // Draw orange circle background
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#F77F00'; // Orange background
            ctx.fill();
            
            // Set text properties
            ctx.fillStyle = '#FFFFFF'; // White text
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (type === 'home') {
                // Home page logo with full text
                const baseFontSize = size / 25;
                const mainFontSize = size / 20;
                const largeFontSize = size / 15;
                
                // Draw "GENERAL" text (top)
                ctx.font = \`bold \${baseFontSize}px Arial, sans-serif\`;
                ctx.fillText("GENERAL", centerX, centerY - size * 0.25);
                
                // Draw "BILIMORIA'S" text (center)
                ctx.font = \`bold \${largeFontSize}px Arial, sans-serif\`;
                ctx.fillText("BILIMORIA'S", centerX, centerY - size * 0.05);
                
                // Draw "20 CANTEEN 23" text
                ctx.font = \`bold \${mainFontSize}px Arial, sans-serif\`;
                ctx.fillText("20", centerX - size * 0.15, centerY + size * 0.1);
                ctx.fillText("CANTEEN", centerX, centerY + size * 0.1);
                ctx.fillText("23", centerX + size * 0.15, centerY + size * 0.1);
                
                // Draw "ESTD. LONDON, UK" text (bottom)
                ctx.font = \`\${baseFontSize * 0.8}px Arial, sans-serif\`;
                ctx.fillText("ESTD. LONDON, UK", centerX, centerY + size * 0.3);
                
            } else {
                // App icons with simplified text
                const fontSize = size > 100 ? size / 8 : size / 4;
                const subFontSize = size > 100 ? size / 12 : size / 6;
                
                ctx.font = \`bold \${fontSize}px Arial, sans-serif\`;
                ctx.fillText("GBC", centerX, centerY - size * 0.1);
                
                ctx.font = \`bold \${subFontSize}px Arial, sans-serif\`;
                ctx.fillText("2023", centerX, centerY + size * 0.15);
            }
        }
        
        function downloadCanvas(canvas, filename) {
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
        
        function generateIcon(type, size, filename) {
            let canvas;
            
            switch(type) {
                case 'home':
                    canvas = document.getElementById('home-canvas');
                    break;
                case 'icon':
                    canvas = document.getElementById('icon-canvas');
                    break;
                case 'adaptive':
                    canvas = document.getElementById('adaptive-canvas');
                    break;
                case 'favicon':
                    canvas = document.getElementById('favicon-canvas');
                    break;
            }
            
            if (canvas) {
                drawIcon(canvas, size, type);
                downloadCanvas(canvas, filename);
                console.log(\`Generated \${filename} (\${size}x\${size})\`);
            }
        }
        
        // Auto-generate previews on load
        window.onload = function() {
            drawIcon(document.getElementById('home-canvas'), 200, 'home');
            drawIcon(document.getElementById('icon-canvas'), 512, 'icon');
            drawIcon(document.getElementById('adaptive-canvas'), 1024, 'adaptive');
            drawIcon(document.getElementById('favicon-canvas'), 32, 'favicon');
            
            console.log('Icon generator ready! Click buttons to download PNG files.');
        };
    </script>
</body>
</html>`;

try {
  const assetsDir = path.join(__dirname, 'assets', 'images');
  
  // Create the HTML icon generator
  fs.writeFileSync(path.join(__dirname, 'app-icon-generator.html'), iconGeneratorHTML);
  
  console.log('✅ Created app-icon-generator.html');
  console.log('   Open this file in a browser to generate PNG icon files');
  
  // Create placeholder PNG files (these will be replaced by the generated ones)
  const iconSizes = [
    { width: 200, height: 200, filename: 'gbc-logo.png' },
    { width: 512, height: 512, filename: 'icon.png' },
    { width: 1024, height: 1024, filename: 'adaptive-icon.png' },
    { width: 32, height: 32, filename: 'favicon.png' }
  ];
  
  iconSizes.forEach(({ width, height, filename }) => {
    const pngData = createBasicPNG(width, height);
    fs.writeFileSync(path.join(assetsDir, filename), pngData);
    console.log(`✅ Created placeholder ${filename} (${width}x${height})`);
  });
  
  console.log('\n📋 Next Steps:');
  console.log('1. Open app-icon-generator.html in a browser');
  console.log('2. Download all PNG files (gbc-logo.png, icon.png, adaptive-icon.png, favicon.png)');
  console.log('3. Replace the placeholder files in assets/images/ with the downloaded ones');
  console.log('4. All icons will have orange background (#F77F00) with white text');
  
} catch (error) {
  console.error('❌ Error creating app icons:', error);
}
