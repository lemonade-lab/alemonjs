import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'url'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import pkg from './package.json'
import dts from 'vite-plugin-dts'
export default defineConfig({
  plugins: [
    react(),
    dts({ insertTypesEntry: true }) // 生成 .d.ts 类型文件
  ],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url))
      }
    ]
  },
  esbuild: {
    drop: process.env.NODE_ENV === 'development' ? [] : ['console', 'debugger']
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: pkg.name,
      formats: ['es', 'cjs']
    },
    commonjsOptions: {
      transformMixedEsModules: true
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
})
