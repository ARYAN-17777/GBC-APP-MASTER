const { exec } = require('child_process');
const path = require('path');

const htmlFile = path.join(__dirname, 'gbc-icon-generator.html');
const command = process.platform === 'win32' ? `start ${htmlFile}` : 
               process.platform === 'darwin' ? `open ${htmlFile}` : 
               `xdg-open ${htmlFile}`;

exec(command, (error) => {
  if (error) {
    console.log('Please manually open: gbc-icon-generator.html');
  } else {
    console.log('✅ Opened GBC icon generator in browser');
  }
});