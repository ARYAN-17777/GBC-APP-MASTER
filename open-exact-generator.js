const { exec } = require('child_process');
const path = require('path');

const htmlFile = path.join(__dirname, 'exact-gbc-icon-generator.html');
const command = process.platform === 'win32' ? `start "${htmlFile}"` : 
               process.platform === 'darwin' ? `open "${htmlFile}"` : 
               `xdg-open "${htmlFile}"`;

exec(command, (error) => {
  if (error) {
    console.log('❌ Could not auto-open. Please manually open: exact-gbc-icon-generator.html');
  } else {
    console.log('✅ Opened EXACT GBC icon generator in browser');
  }
});