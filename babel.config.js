module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'react' }]
    ],
    plugins: [
      // Required for React Native Reanimated
      'react-native-reanimated/plugin',
    ],
  };
};
