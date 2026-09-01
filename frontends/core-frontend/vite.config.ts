import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'url';
import react from '@vitejs/plugin-react';
import theme from '@alemonjs/react-ui/theme.json';
const NODE_ENV = process.env.NODE_ENV === 'development';
const SERVER_URL = process.env.VITE_ALEMONJS_SERVER_URL;
export default defineConfig({
  // Keep assets usable when the UI is mounted behind a reverse-proxy path.
  base: './',
  define: {
    'process.env.ALEMONJS_CSS_VARIABLES': NODE_ENV ? JSON.stringify(theme) : '{}'
  },
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url))
      }
    ]
  },
  esbuild: {
    drop: NODE_ENV ? [] : ['console', 'debugger']
  },
  server: SERVER_URL
    ? {
        proxy: {
          '/api': {
            target: SERVER_URL,
            changeOrigin: true
          }
        }
      }
    : undefined,
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    },
    minify: 'terser',
    terserOptions: {
      compress: NODE_ENV
        ? {}
        : {
            drop_console: true,
            drop_debugger: true
          }
    },
    rollupOptions: {
      output: {
        dir: '../../packages/alemonjs/dist',
        entryFileNames: `assets/index.js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
});
