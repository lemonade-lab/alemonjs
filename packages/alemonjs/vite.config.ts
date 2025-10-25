import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    nodePolyfills({
      include: [
        'http',
        'https',
        'stream',
        'zlib',
        'util',
        'buffer',
        'process',
        'crypto',
        'url',
        'querystring',
        'os',
        'assert',
        'constants',
        'path',
        'net',
        'module',
        'child_process',
        'vm',
        'events'
      ],
      globals: {
        Buffer: true,
        global: true,
        process: true
      },
      protocolImports: true
    })
  ],
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'alemonjs',
      fileName: format => `alemonjs.${format}.js`,
      formats: ['es']
    },
    rollupOptions: {
      external: []
    }
  },
  resolve: {
    alias: {
      'fs/promises': path.resolve(__dirname, 'src/polyfills/fs-promises.ts'),
      'node:fs/promises': path.resolve(__dirname, 'src/polyfills/fs-promises.ts'),
      fs: path.resolve(__dirname, 'src/polyfills/fs.ts'),
      'node:fs': path.resolve(__dirname, 'src/polyfills/fs.ts'),
      'util/types': path.resolve(__dirname, 'src/polyfills/util-types.ts'),
      'node:util/types': path.resolve(__dirname, 'src/polyfills/util-types.ts')
    }
  },
  define: {
    // 修复全局对象定义
    global: 'globalThis',
    globalThis: 'globalThis',
    window: 'globalThis',
    self: 'globalThis',
    'process.env.BROWSER_ENV': JSON.stringify('browser')
  }
});
