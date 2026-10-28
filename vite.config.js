import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function devHtmlPlugin() {
  return {
    name: 'dev-html-transform',
    transformIndexHtml(html, ctx) {
      if (ctx.server) {
        return html
          .replace(/<script type="module" crossorigin src="\.\/assets\/[^"]+"><\/script>/, '<script type="module" src="/src/main.jsx"></script>')
          .replace(/<link rel="stylesheet" crossorigin href="\.\/assets\/[^"]+">/, '');
      }
      return html;
    },
  };
}

export default defineConfig({
  plugins: [react(), devHtmlPlugin()],
  base: './',
  server: {
    port: 5173,
    open: false,
  },
});
