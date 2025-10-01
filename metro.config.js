const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle TypeScript errors gracefully
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add transformer configuration
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Ignore problematic files and duplicate directories during build
config.resolver.blacklistRE = /GBC\/.*|GBC-FRESH-BUILD\/.*|GBC-Fresh\/.*|GBCBILL\/.*|tests\/.*|scripts\/.*|supabase\/functions\/.*/;

module.exports = config;
