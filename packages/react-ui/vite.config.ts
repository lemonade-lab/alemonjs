import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'url'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import pkg from './package.json'
import dts from 'vite-plugin-dts'
export default defineConfig({
  plugins: [
    react(),
    dts({
      rollupTypes: true,
      insertTypesEntry: true,
      tsconfigPath: './tsconfig.app.json'
    })
  ],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url))
      }
    ]
  },
  build: {
    outDir: 'lib',
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: pkg.name,
      formats: ['cjs', 'es']
    },
    cssTarget: 'chrome61',
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
