const fs = require('fs');
const path = require('path');

// Create a simple valid PNG file (1x1 pixel orange)
// PNG signature + IHDR + IDAT + IEND chunks
function createValidPNG(width, height, color = [247, 127, 0]) { // Orange color #F77F00
  const png = Buffer.alloc(1000); // Allocate enough space
  let offset = 0;

  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  signature.copy(png, offset);
  offset += signature.length;

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);     // Width
  ihdrData.writeUInt32BE(height, 4);    // Height
  ihdrData.writeUInt8(8, 8);            // Bit depth
  ihdrData.writeUInt8(2, 9);            // Color type (RGB)
  ihdrData.writeUInt8(0, 10);           // Compression
  ihdrData.writeUInt8(0, 11);           // Filter
  ihdrData.writeUInt8(0, 12);           // Interlace

  // Write IHDR chunk
  png.writeUInt32BE(13, offset);        // Chunk length
  offset += 4;
  png.write('IHDR', offset);            // Chunk type
  offset += 4;
  ihdrData.copy(png, offset);           // Chunk data
  offset += 13;

  // Calculate CRC for IHDR
  const ihdrCrc = calculateCRC(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
  png.writeUInt32BE(ihdrCrc, offset);
  offset += 4;

  // IDAT chunk (image data)
  const pixelData = Buffer.alloc(width * height * 3); // RGB data
  for (let i = 0; i < pixelData.length; i += 3) {
    pixelData[i] = color[0];     // R
    pixelData[i + 1] = color[1]; // G
    pixelData[i + 2] = color[2]; // B
  }

  // Simple deflate compression (uncompressed blocks)
  const compressedData = Buffer.alloc(pixelData.length + 100);
  let compOffset = 0;

  // Deflate header
  compressedData[compOffset++] = 0x78; // CMF
  compressedData[compOffset++] = 0x01; // FLG

  // Uncompressed block
  compressedData[compOffset++] = 0x01; // BFINAL=1, BTYPE=00
  compressedData.writeUInt16LE(pixelData.length, compOffset); // LEN
  compOffset += 2;
  compressedData.writeUInt16LE(~pixelData.length, compOffset); // NLEN
  compOffset += 2;

  // Copy pixel data
  pixelData.copy(compressedData, compOffset);
  compOffset += pixelData.length;

  // Adler32 checksum
  const adler32 = calculateAdler32(pixelData);
  compressedData.writeUInt32BE(adler32, compOffset);
  compOffset += 4;

  // Write IDAT chunk
  png.writeUInt32BE(compOffset, offset); // Chunk length
  offset += 4;
  png.write('IDAT', offset);             // Chunk type
  offset += 4;
  compressedData.copy(png, offset, 0, compOffset); // Chunk data
  offset += compOffset;

  // Calculate CRC for IDAT
  const idatCrc = calculateCRC(Buffer.concat([Buffer.from('IDAT'), compressedData.slice(0, compOffset)]));
  png.writeUInt32BE(idatCrc, offset);
  offset += 4;

  // IEND chunk
  png.writeUInt32BE(0, offset);          // Chunk length
  offset += 4;
  png.write('IEND', offset);             // Chunk type
  offset += 4;
  const iendCrc = calculateCRC(Buffer.from('IEND'));
  png.writeUInt32BE(iendCrc, offset);
  offset += 4;

  return png.slice(0, offset);
}

// Simple CRC32 calculation
function calculateCRC(data) {
  const crcTable = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }

  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Simple Adler32 calculation
function calculateAdler32(data) {
  let a = 1, b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  return (b << 16) | a;
}

console.log('🎨 Creating valid PNG icon files...');

try {
  const assetsDir = path.join(__dirname, 'assets', 'images');

  // Create different sized icons
  const icons = [
    { name: 'icon.png', size: 512 },
    { name: 'adaptive-icon.png', size: 1024 },
    { name: 'favicon.png', size: 32 }
  ];

  icons.forEach(({ name, size }) => {
    console.log(`Creating ${name} (${size}x${size})...`);
    const pngData = createValidPNG(size, size);
    const filePath = path.join(assetsDir, name);
    fs.writeFileSync(filePath, pngData);
    console.log(`✅ Created ${name} - ${pngData.length} bytes`);
  });

  console.log('🎉 All PNG icons created successfully!');

} catch (error) {
  console.error('❌ Error creating PNG files:', error);
  process.exit(1);
}