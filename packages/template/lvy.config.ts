import { defineConfig } from 'lvyjs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __dirname = dirname(fileURLToPath(import.meta.url))
const App = () => import('alemonjs').then(res => res.start('src/index.ts'))
console.log(process.argv)
export default defineConfig({
  plugins: [() => App],
  alias: {
    entries: [{ find: '@src', replacement: join(__dirname, 'src') }]
  },
  build: {
    typescript: {
      removeComments: true
    }
  }
})
