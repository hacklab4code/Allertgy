function transformImportMeta({ types: t }) {
  return {
    visitor: {
      MetaProperty(path) {
        if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
          path.replaceWith(
            t.objectExpression([
              t.objectProperty(
                t.identifier('env'),
                t.memberExpression(t.identifier('process'), t.identifier('env'))
              ),
            ])
          );
        }
      },
    },
  };
}

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      transformImportMeta,
      // three@r185 uses static class blocks; keep this explicit for Metro/Hermes
      ['@babel/plugin-transform-class-static-block', { loose: true }],
      // Must stay last
      'react-native-reanimated/plugin',
    ],
  };
};

