import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import json from '@rollup/plugin-json';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import pkg from './package.json' assert { type: 'json' };

const production = process.env.BUILD === 'production';
const development = process.env.BUILD === 'development';

export default {
  input: 'src/hyper-light-card.ts',
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: true, // Always generate source map
  },
  plugins: [
    replace({
      'process.env.VERSION': JSON.stringify(pkg.version),
      preventAssignment: true,
    }),
    nodePolyfills(),
    resolve({
      browser: true,
      preferBuiltins: false,
      dedupe: ['lit-html', 'lit-element'],
    }),
    commonjs(),
    json(),
    typescript(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: [
        [
          '@babel/preset-env',
          {
            targets: '> 0.25%, not dead',
            modules: false,
          },
        ],
      ],
      extensions: ['.ts', '.js'],
    }),
    postcss({
      extract: false,
      inject: false,
      use: ['sass'],
      config: {
        path: './postcss.config.cjs',
        ctx: {
          env: production ? 'production' : 'development',
        },
      },
    }),
    production && terser(),
  ].filter(Boolean),
  onwarn(warning, warn) {
    if (
      warning.code === 'CIRCULAR_DEPENDENCY' &&
      warning.importer.includes('node_modules/lit-html')
    ) {
      return;
    }
    if (warning.code === 'THIS_IS_UNDEFINED') return;
    warn(warning);
  },
};
