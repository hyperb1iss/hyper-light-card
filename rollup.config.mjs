import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import { readFileSync } from 'fs';
import postcss from 'rollup-plugin-postcss';

// Simple JSON parsing
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const production = process.env.BUILD === 'production';
const development = process.env.BUILD === 'development';

export default {
  input: 'src/hyper-light-card.ts',
  output: {
    file: 'target/hyper-light-card.js',
    format: 'es',
    sourcemap: true,
    inlineDynamicImports: true,
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
      mainFields: ['module', 'main'],
    }),
    commonjs({ include: 'node_modules/**', extensions: ['.js', '.ts'] }),
    json(),
    postcss({ extract: false, inject: true, minimize: production, use: ['sass'] }),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: true,
      inlineSources: !production,
      compilerOptions: { declaration: false },
    }),
    production && terser({
      compress: {
        pure_funcs: ['log.debug', 'log.log', 'log.warn', 'console.debug'],
        passes: 2,
      },
    }),
  ].filter(Boolean),
  onwarn(warning, warn) {
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    if (warning.code === 'THIS_IS_UNDEFINED') return;
    warn(warning);
  },
};
