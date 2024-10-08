import { defineConfig } from 'alemonjs'
import { alias, files } from 'alemonjs/plugins'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export default defineConfig({
  build: {
    plugins: [
      alias({
        entries: [
          { find: '@xiuxian', replacement: join(__dirname, 'src', 'xiuxian') },
          { find: '@src', replacement: join(__dirname, 'src') }
        ]
      }),
      files({ filter: /\.(png|jpg)$/ })
    ]
  }
})
