import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Simple JSON parsing for version info
const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
);

// Determine build mode
const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/hyper-light-card.ts'),
      formats: ['es'],
      fileName: 'hyper-light-card',
    },
    outDir: 'target', // Match tsconfig output directory
    sourcemap: isProduction, // Only generate sourcemaps in production
    rollupOptions: {
      output: {
        preserveModules: false,
        banner: '/* Hyper Light Card v' + pkg.version + ' - Apache 2.0 Licensed */',
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
      },
    },
    minify: 'terser',
    terserOptions: {
      ecma: 2020,
      format: {
        comments: false,
        // Try to preserve as little whitespace as possible
        beautify: false,
      },
      compress: {
        arrows: true,
        arguments: true,
        booleans_as_integers: true,
        booleans: true,
        collapse_vars: true,
        comparisons: true,
        computed_props: true,
        conditionals: true,
        dead_code: true,
        defaults: true,
        directives: true,
        drop_console: false,
        drop_debugger: isProduction,
        evaluate: true,
        expression: true,
        global_defs: {
          __IS_LOGGING_ENABLED__: !isProduction,
        },
        hoist_funs: true,
        hoist_props: true,
        hoist_vars: false,
        if_return: true,
        inline: true,
        join_vars: true,
        keep_classnames: false,
        keep_fargs: false,
        keep_fnames: false,
        keep_infinity: true,
        loops: true,
        module: true,
        negate_iife: true,
        passes: 3,
        properties: true,
        pure_getters: true,
        pure_funcs: isProduction ? ['log.debug', 'log.log', 'log.warn', 'console.debug', 'console.warn'] : [],
        reduce_vars: true,
        sequences: true,
        side_effects: true,
        switches: true,
        toplevel: true,
        typeofs: true,
        unused: true,
      },
      mangle: {
        eval: true,
        keep_classnames: false,
        keep_fnames: false,
        module: true,
        toplevel: true,
        safari10: false,
        properties: {
          regex: /^_/
        }
      },
    }
  },
  define: {
    'process.env.VERSION': JSON.stringify(pkg.version),
    '__IS_LOGGING_ENABLED__': JSON.stringify(!isProduction),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  css: {
    // Enable CSS modules for all CSS files
    modules: {
      // Generate scoped class names
      generateScopedName: '[local]_[hash:base64:5]',
    },
    // Keep original class names alongside hashed ones
    devSourcemap: true,
  },
}); 