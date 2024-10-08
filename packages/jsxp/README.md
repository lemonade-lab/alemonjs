# jsxp

这是一个可以在 tsx 环境中,使用 puppeteer 对 tsx 组件进行截图的库

> VScode 安装插件 `ES7+ React/Redux/React-Native snippets`

## 环境准备

```sh
yarn add jsxp -W
```

- .puppeteerrc.cjs

> 自动搜索浏览器内核

```cjs
/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = require('jsxp/.puppeteerrc')
```

- tsconfig.json

```json
{
  "include": ["src/**/*"],
  "extends": ["jsxp/tsconfig.json"]
}
```

## 使用教程

```tsx
// src/Word.tsx
import React from 'react'
export default () => {
  return (
    <html>
      <body>
        <div> hello React ! </div>
      </body>
    </html>
  )
}
```

```ts
// src/image.tsx
import React from 'react'
import { pictureRender, render, ObtainProps } from 'jsxp'
import Word from './Word.tsx'
export const pictureRender = (uid: number, Props: ObtainProps<typeof Word>) => {
  // 生成 html 地址 或 html字符串
  return render({
    // html/hello/uid.html
    path: 'hello',
    name: `${uid}.html`,
    component: <Word {...Props} />
  })
}
```

```ts
// src/index.ts
import { pictureRender } from './image.tsx'
const img: Buffer | false = await pictureRender(123456, {})
if (img) {
  // 可fs保存到本地
}
```

## 本地调试

- tsconfig.json

```json
{
  "include": ["jsxp.config.tsx"]
}
```

- jsxp.config.tsx

```tsx
import React from 'react'
import { defineConfig } from 'jsxp'
const Music = () => {
  return (
    <html>
      <body>
        <div> 我的音乐</div>
      </body>
    </html>
  )
}
export default defineConfig()
```

- dev

```sh
npx jsxp dev
```

## 扩展功能

> VScode 安装插件 `Path Intellisense`

### 文件引入

`createRequire` 请确保引入的是项目目录下的文件

```ts
import React from 'react'
import { BackgroundImage, createRequire } from 'jsxp'
const require = createRequire(import.meta.url)
export default function Word() {
  return (
    <html>
      <body>
        <BackgroundImage url={require('./resources/example.png')} size="100% 100%">
          我有了一个背景图
        </BackgroundImage>
        <img src={require('./resources/example.svg')} />
        <img src={require('./resources/example.png')} />
      </body>
    </html>
  )
}
```

### 元素插入

```tsx title="./link.tsx"
import { createRequire, LinkStyleSheet, LinkESM } from 'jsxp'
const require = createRequire(import.meta.url)
export const Link = () => {
  return (
    <html>
      <head>
        <LinkStyleSheet src={require('../../resources/css/hello.css')} />
      </head>
      <body>
        <LinkESM src={require('../../resources/js/hello.js')} />
      </body>
    </html>
  )
}
```

## tailwindcss

可以跟 talwindcss 结合，生产 css 后，引入到 head 组件

```sh
yarn add tailwind -W
```

- input.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- tailwind.config.js

```js
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
/**
 * @type {import('tailwindcss').Config}
 */
export default {
  // 内容
  content: ['src/**/*.{jsx.tsx.html}'],
  plugins: []
}
```

- output

`npx` 本地 `-i` 输入 `-o` 输出 `-m` 压缩

```sh
npx tailwindcss -i ./input.css -o ./output.css -m
```

- link.tsx

```tsx
import React from 'react'
import { createRequire, LinkStyleSheet } from 'jsxp'
const require = createRequire(import.meta.url)
export const Link = () => <LinkStyleSheet src={require('./output.css')} />
```
