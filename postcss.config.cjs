module.exports = ctx => ({
  plugins: [
    require('autoprefixer'),
    ctx.env === 'production' ? require('cssnano') : null,
  ].filter(Boolean),
});
