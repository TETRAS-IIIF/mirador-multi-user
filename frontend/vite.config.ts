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
        if (!/\/src\/.*\.js$/.test(id)) return null;
        return transformWithEsbuild(code, id, {
          loader: 'jsx',
          jsx: 'automatic',
        });
      },
    },
    tsconfigPaths(),
    react(),
  ],
  resolve: {
    alias: {
      'mirador-mltools-plugin-mmu': fileURLToPath(
        new URL(
          './node_modules/mirador-mltools-plugin-mmu/dist/mirador-mltools-plugin.es.js',
          import.meta.url,
        ),
      ),
      'prop-types': 'prop-types/index.js',
    },
    dedupe: [
      'react',
      'react-dom',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled',
    ],
    mainFields: ['module', 'jsnext:main', 'browser', 'main'],
  },
  optimizeDeps: {
    include: ['react-is', 'hoist-non-react-statics', 'scheduler', 'prop-types'],
    esbuildOptions: {},
    exclude: ['mirador-annotation-editor'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
});
