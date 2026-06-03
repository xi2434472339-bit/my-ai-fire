import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    // 允许 localtunnel 等隧道域名访问（每次隧道子域名不同）
    allowedHosts: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
});
