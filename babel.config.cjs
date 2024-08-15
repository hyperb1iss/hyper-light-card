module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: '> 0.25%, not dead',
      modules: 'auto',  // Handle ES modules
    }],
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-transform-typescript',
  ],
};
