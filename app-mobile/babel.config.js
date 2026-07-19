module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // three@r185 uses static class blocks; keep this explicit for Metro/Hermes
      ['@babel/plugin-transform-class-static-block', { loose: true }],
      // Must stay last
      'react-native-reanimated/plugin',
    ],
  };
};
