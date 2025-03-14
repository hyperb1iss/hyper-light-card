import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import { readFileSync } from 'fs';

// Simple JSON parsing
const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
);

const production = process.env.BUILD === 'production';
const development = process.env.BUILD === 'development';

export default {
  input: 'src/hyper-light-card.ts',
  output: {
    file: 'target/hyper-light-card.js',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    replace({
      'process.env.VERSION': JSON.stringify(pkg.version),
      __IS_LOGGING_ENABLED__: JSON.stringify(!production),
      preventAssignment: true,
    }),
    nodePolyfills(),
    resolve({
      browser: true,
      preferBuiltins: false,
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
    commonjs(),
    json(),
    postcss({
      extract: false,
      inject: true,
      minimize: production,
      use: ['sass'],
    }),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: true,
      inlineSources: !production,
      compilerOptions: {
        declaration: false,
      },
    }),
    production && terser(),
  ].filter(Boolean),
  onwarn(warning, warn) {
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    if (warning.code === 'THIS_IS_UNDEFINED') return;
    warn(warning);
  },
};
