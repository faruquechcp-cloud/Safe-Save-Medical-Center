
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_APP_URL': JSON.stringify(process.env.APP_URL || 'http://localhost:3000')
  },
  base: './', // CRITICAL: Makes all asset paths relative for Electron's file:// protocol
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        license: path.resolve(__dirname, 'license.html'),
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'dexie', 'dexie-react-hooks'],
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    host: '0.0.0.0'
  }
});
