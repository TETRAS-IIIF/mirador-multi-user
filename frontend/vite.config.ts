import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    global: 'window',
  },
  plugins: [
    {
      name: 'treat-js-files-as-jsx',
      async transform(code, id) {
        if (!id.match(/src\/.*\.js$/)) return null;

        // Use the exposed transform from vite, instead of directly
        // transforming with esbuild
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
    commonjsOptions: { transformMixedEsModules: true },
  },
  optimizeDeps: {
    include: ['mirador-annotation-editor'],
    esbuildOptions: { loader: { '.js': 'jsx' } },
  },
  resolve: {
    alias: {
      'mirador-annotation-editor': fileURLToPath(
        new URL(
          './node_modules/mirador-annotation-editor/es/index.js',
          import.meta.url,
        ),
      ),
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
