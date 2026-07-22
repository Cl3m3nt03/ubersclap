module.exports = function (api) {
  api.cache(true);
  return {
    // Le plugin Babel de Reanimated est ajoute automatiquement par
    // babel-preset-expo des que la librairie est installee (docs SDK 57).
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
