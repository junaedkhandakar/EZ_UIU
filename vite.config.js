import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    open: '/app.html',
  },
  build: {
    // app.html is the source-of-truth entry; the built dist/index.html is
    // synced to the repo root by the `build` script for branch-based
    // GitHub Pages serving (index.html at root is a generated artifact).
    rollupOptions: {
      input: { main: resolve(__dirname, 'app.html') },
    },
  },
});
