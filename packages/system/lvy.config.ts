import { defineConfig } from 'lvyjs'
import { alias, files } from 'lvyjs/plugins'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export default defineConfig({
  plugins: [
    {
      name: 'alemon',
      callback: () => {
        if (process.argv.includes('--alemonjs')) {
          process.argv.push('--alemonjs-dev')
          import('alemonjs')
        }
      }
    },
    {
      name: 'jsxp',
      callback: async () => {
        if (process.argv.includes('--view')) {
          const { createServer } = await import('jsxp')
          createServer()
        }
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
