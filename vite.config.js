import { defineConfig } from 'vite';
import { createAdgDebugLogPlugin } from './src/debug/vite-debug-log-plugin.js';

export default defineConfig({
  plugins: [
    createAdgDebugLogPlugin(),
  ],
  server: {
    watch: {
      ignored: [
        '**/.git/**',
        '**/dist/**',
        '**/logs/**',
        '**/Konzepte/**',
        '**/docs/source/new scan/**',
        '**/docs/source/rules-v2-examples/**',
        '**/docs/source/**/*.pdf',
        '**/docs/source/**/*.png',
        '**/docs/source/**/*.jpg',
        '**/docs/source/**/*.jpeg',
        '**/docs/source/**/*.webp',
        '**/page40.png',
        '**/page41.png',
      ],
    },
  },
});
