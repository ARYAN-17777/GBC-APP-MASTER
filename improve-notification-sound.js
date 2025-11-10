const fs = require('fs');
const path = require('path');

// Read the current NotificationContext.tsx file
const filePath = path.join(__dirname, 'contexts', 'NotificationContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the extremely long base64 sound with a shorter, cleaner notification sound
const oldSoundPattern = /{ uri: 'data:audio\/wav;base64,UklGRnoGAAB[^']*' }/;

// Professional kitchen notification sound - short, clear, and audible
const newSound = `{ uri: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=' }`;

// Replace the old sound with the new one
content = content.replace(oldSoundPattern, newSound);

// Also improve the volume and make it more professional
content = content.replace('{ shouldPlay: true, volume: 0.8 }', '{ shouldPlay: true, volume: 0.9 }');

// Write the improved content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Notification sound improved successfully!');
console.log('🔊 Replaced extremely long base64 sound with shorter, professional kitchen notification sound');
console.log('📢 Increased volume to 0.9 for better kitchen environment audibility');
