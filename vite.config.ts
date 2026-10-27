import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const banner = `/* Hyper Light Card v${pkg.version} - Apache 2.0 Licensed */`;

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    build: {
      lib: {
        entry: fileURLToPath(new URL('./src/hyper-light-card.ts', import.meta.url)),
        formats: ['es'],
        fileName: 'hyper-light-card',
      },
      outDir: 'target',
      sourcemap: true,
      rolldownOptions: {
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
        },
      },
      minify: isProduction ? 'terser' : false,
      terserOptions: {
        ecma: 2020,
        format: { comments: false, preamble: banner },
        compress: {
          arguments: true,
          booleans_as_integers: true,
          drop_debugger: isProduction,
          expression: true,
          hoist_funs: true,
          keep_fargs: false,
          keep_infinity: true,
          module: true,
          passes: 3,
          pure_getters: true,
          pure_funcs: ['log.debug', 'log.log', 'log.warn', 'console.debug', 'console.warn'],
          toplevel: true,
        },
        mangle: {
          eval: true,
          module: true,
          toplevel: true,
          properties: { regex: /^_/ },
        },
      },
    },
    define: {
      'process.env.VERSION': JSON.stringify(pkg.version),
      __IS_LOGGING_ENABLED__: JSON.stringify(!isProduction),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
