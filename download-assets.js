// Download proper placeholder images for the app
const https = require('https');
const fs = require('fs');
const path = require('path');

const downloadFile = (url, filepath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

async function downloadAssets() {
  console.log('📥 Downloading placeholder assets...');
  
  const assetsDir = path.join(__dirname, 'assets', 'images');
  
  // Ensure directory exists
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  try {
    // Use placeholder.com for simple colored placeholders
    const assets = [
      {
        url: 'https://via.placeholder.com/1024x1024/F47B20/FFFFFF?text=GBC',
        filename: 'icon.png',
        description: 'App icon (1024x1024)'
      },
      {
        url: 'https://via.placeholder.com/1284x2778/F47B20/FFFFFF?text=GBC+Restaurant',
        filename: 'splash.png',
        description: 'Splash screen (1284x2778)'
      },
      {
        url: 'https://via.placeholder.com/432x432/F47B20/FFFFFF?text=GBC',
        filename: 'adaptive-icon.png',
        description: 'Adaptive icon (432x432)'
      }
    ];

    for (const asset of assets) {
      const filepath = path.join(assetsDir, asset.filename);
      console.log(`📥 Downloading ${asset.description}...`);
      
      try {
        await downloadFile(asset.url, filepath);
        console.log(`✅ Downloaded ${asset.filename}`);
      } catch (error) {
        console.log(`⚠️  Failed to download ${asset.filename}, creating fallback...`);
        
        // Create a minimal valid PNG file as fallback
        const fallbackPNG = createMinimalPNG();
        fs.writeFileSync(filepath, fallbackPNG);
        console.log(`✅ Created fallback ${asset.filename}`);
      }
    }

    console.log('');
    console.log('✅ All assets created successfully!');
    console.log('📁 Assets location: assets/images/');
    
  } catch (error) {
    console.error('❌ Error downloading assets:', error);
    throw error;
  }
}

// Create a minimal valid PNG file (1x1 pixel)
function createMinimalPNG() {
  // This is a valid 1x1 transparent PNG file in base64, converted to buffer
  const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  return Buffer.from(base64PNG, 'base64');
}

// Run the script
downloadAssets().catch(console.error);
