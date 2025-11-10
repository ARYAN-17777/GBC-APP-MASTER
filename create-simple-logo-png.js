const fs = require('fs');
const path = require('path');

console.log('🎨 Creating a simple PNG logo representation...');

// Since we can't generate actual PNG files without image libraries,
// let's copy an existing icon and rename it as a temporary solution
// and create a React Native component that renders the logo

const logoComponent = `
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  style?: any;
}

export const GBCLogo: React.FC<LogoProps> = ({ size = 70, style }) => {
  const logoSize = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View style={[styles.logoContainer, logoSize, style]}>
      <Text style={[styles.logoTextTop, { fontSize: size * 0.11 }]}>GENERAL</Text>
      <Text style={[styles.logoTextMain, { fontSize: size * 0.16 }]}>BILIMORIA'S</Text>
      <Text style={[styles.logoTextSub, { fontSize: size * 0.13 }]}>CANTEEN</Text>
      <Text style={[styles.logoTextBottom, { fontSize: size * 0.07 }]}>ESTD. LONDON, UK</Text>
      <View style={styles.logoYearContainer}>
        <Text style={[styles.logoYear, { fontSize: size * 0.09 }]}>20</Text>
        <Text style={[styles.logoYear, { fontSize: size * 0.09 }]}>23</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    backgroundColor: '#000000', // Black background as per reference
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  logoTextTop: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 1,
    position: 'absolute',
    top: 8,
    textAlign: 'center',
  },
  logoTextMain: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: -2,
  },
  logoTextSub: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginTop: -1,
  },
  logoTextBottom: {
    color: '#FFFFFF',
    fontWeight: 'normal',
    letterSpacing: 0.3,
    position: 'absolute',
    bottom: 12,
    textAlign: 'center',
    opacity: 0.9,
  },
  logoYearContainer: {
    position: 'absolute',
    bottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 40,
  },
  logoYear: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    opacity: 0.7,
  },
});

export default GBCLogo;
`;

try {
  // Create the logo component
  const componentsDir = path.join(__dirname, 'components');
  if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(componentsDir, 'GBCLogo.tsx'), logoComponent);
  
  console.log('✅ Created GBCLogo component: components/GBCLogo.tsx');
  
  // Copy an existing icon as a temporary PNG logo
  const assetsDir = path.join(__dirname, 'assets', 'images');
  const existingIcon = path.join(assetsDir, 'icon.png');
  const newLogo = path.join(assetsDir, 'gbc-new-logo.png');
  
  if (fs.existsSync(existingIcon)) {
    fs.copyFileSync(existingIcon, newLogo);
    console.log('✅ Created temporary logo PNG: assets/images/gbc-new-logo.png');
    console.log('   (This is a copy of the existing icon - replace with actual logo design)');
  }
  
  console.log('\n📋 Implementation Options:');
  console.log('1. Use the GBCLogo component for a text-based logo with black background');
  console.log('2. Replace gbc-new-logo.png with an actual PNG of the reference design');
  console.log('3. The component matches the reference image layout and colors');
  
} catch (error) {
  console.error('❌ Error creating logo files:', error);
}
