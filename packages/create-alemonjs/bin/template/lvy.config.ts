import { defineConfig } from 'lvyjs'
import { alias, files } from 'lvyjs/plugins'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { onStart } from 'alemonjs'
import { createServer } from 'jsxp'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export default defineConfig({
  plugins: [
    {
      name: 'alemon',
      callback: () => {
        if (process.argv.includes('--alemonjs')) onStart('src/index.ts')
      }
    },
    {
      name: 'jsxp',
      callback: () => {
        if (process.argv.includes('--view')) createServer()
      }
    }
  ],
  build: {
    plugins: [
      alias({
        entries: [{ find: '@src', replacement: join(__dirname, 'src') }]
      }),
      files({ filter: /\.(png|jpg)$/ })
    ]
  }
})
