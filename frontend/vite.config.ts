// vite.config.ts
import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  define: { global: 'window' },
  plugins: [
    {
      name: 'treat-js-files-as-jsx',
      async transform(code, id) {
        if (!id.match(/src\/.*\.js$/)) return null;
        return transformWithEsbuild(code, id, {
          loader: 'jsx',
          jsx: 'automatic',
        });
      },
    },
    tsconfigPaths(),
    react(),
  ],
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      exclude: [/mirador-annotation-editor/], // prevent CJS wrapper on ESM file
    },
  },
  optimizeDeps: {
    exclude: ['mirador-annotation-editor'], // do not prebundle; load as-is
    esbuildOptions: { loader: { '.js': 'jsx' } },
  },
  resolve: {
    alias: {
      // point to the file that actually exists
      'mirador-annotation-editor': fileURLToPath(
        new URL(
          './node_modules/mirador-annotation-editor/es/index.js',
          import.meta.url,
        ),
      ),
      // keep mltools pointing to its only entry
      'mirador-mltools-plugin-mmu': fileURLToPath(
        new URL(
          './node_modules/mirador-mltools-plugin-mmu/dist/mirador-mltools-plugin.es.js',
          import.meta.url,
        ),
      ),
    },
    mainFields: ['module', 'jsnext:main', 'browser', 'main'],
  },
});
