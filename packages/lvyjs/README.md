# LVY

长春藤。 一款为 node 构建的开发工具

```sh
npm install lvyjs -D
```

```ts
// lvy.config.ts
import { defineConfig } from 'lvyjs'
import { alias, files } from 'lvyjs/plugins'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export default defineConfig({
  plugins: [
    {
      name: 'my-app',
      callback: () => {
        // 要执行的会调函数
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
```

```sh
npx lvy dev
```

```sh
npx lvy build
```
