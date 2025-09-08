import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'url';
import react from '@vitejs/plugin-react';
import theme from '@alemonjs/react-ui/theme.json';
const NODE_ENV = process.env.NODE_ENV === 'development';
export default defineConfig({
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
        dir: '../../packages/discord/dist',
        entryFileNames: `assets/index.js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
});
