import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/directus-proxy': {
        target: 'https://xer.pascalito.com.ar',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/directus-proxy/, ''),
      },
    },
  },
});
