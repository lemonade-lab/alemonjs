# React-Puppeteer

这是一个可以在 tsx 环境中,使用 puppeteer 对 tsx 组件进行截图的库

强大的现代化框架 React.js 将为你管理组件和代码

[点击 学习 React.js](https://react.docschina.org/)

> VScode 安装插件 `ES7+ React/Redux/React-Native snippets`

## 环境准备

```sh
yarn add react-puppeteer -W
```

- .puppeteerrc.cjs

> 自动搜索浏览器内核

```cjs
/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = require('react-puppeteer/.puppeteerrc')
```

- tsconfig.json

```json
{
  "include": ["src/**/*"],
  // 继承react-puppeteer的ts配置
  "extends": ["react-puppeteer/tsconfig.json"]
}
```

## 使用教程

```tsx
// src/Word.tsx
import React from 'react'
export default () => {
  return <div> hello React ! </div>
}
```

```ts
// src/image.tsx
import React from 'react'
import { pictureRender, render, ObtainProps } from 'react-puppeteer'
import Word from './Word.tsx'
export const pictureRender = (uid: number, Props: ObtainProps<typeof Word>) => {
  // 生成 html 地址 或 html字符串
  return render({
    // html/hello/uid.html
    join_dir: 'hello',
    html_name: `${uid}.html`,
    html_body: <Word {...Props} />
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

- run

```sh
npx tsx src/index.ts
```

## 本地调试

- tsconfig.json

```json
{
  "include": ["tsxp.config.tsx"]
}
```

- tsxp.config.tsx

```tsx
import React from 'react'
import { defineConfig } from 'react-puppeteer'
const Music = () => {
  return <div> 我的音乐</div>
}
export default defineConfig([
  {
    url: '/music',
    options: {
      html_body: <Music />
    }
  }
])
```

- dev

```sh
npx tsxp dev
```

## 扩展功能

> VScode 安装插件 `Path Intellisense`

### 文件引入

`createRequire` 请确保引入的是项目目录下的文件

```ts
import React from 'react'
import { BackgroundImage, createRequire } from 'react-puppeteer'
const require = createRequire(import.meta.url)
export default function Word() {
  return (
    <>
      <BackgroundImage url={require('./resources/example.png')} size="100% 100%">
        我有了一个背景图
      </BackgroundImage>
      <img src={require('./resources/example.svg')} />
      <img src={require('./resources/example.png')} />
    </>
  )
}
```

### 截图方块

Puppeteer 截图是默认 body

你可以指定截图的元素为`section`

也可以设置`section`为指定的高度

```ts
export default function Word({ data }: PropsType) {
  return (
    <div className="text-red-500 p-2 text-xl m-80">
      Hello, {data.name}!<section className="h-[80rem] w-[90rem]">嘎嘎</section>
    </div>
  )
}
```

```tsx
export const pictureRender = (uid: number, Props: Parameters<typeof Word>[0]) => {
  // 生成 html 地址 或 html字符串
  return render(
    {
      // html/hello/uid.html
      join_dir: 'hello',
      html_name: `${uid}.html`,
      html_body: <Word {...Props} />
    },
    {
      tab: 'section'
    }
  )
}
```

### 元素插入

```tsx title="./link.tsx"
import { createRequire, LinkCSS, LinkESM } from 'react-puppeteer'
const require = createRequire(import.meta.url)
export const Link = () => {
  return (
    <>
      <LinkESM src={require('../../resources/js/hello.js')} />
      <LinkCSS src={require('../../resources/css/hello.css')} />
    </>
  )
}
```

```ts title="./image.tsx"
import { readFileSync } from 'fs'
import { render } from 'react-puppeteer'
import { Link } from './link.tsx'
export const pictureRender = (uid: number, Props: Parameters<typeof Word>[0]) => {
  // 生成 html 地址 或 html字符串
  return render({
    // html/hello/uid.html
    join_dir: 'hello',
    html_name: `${uid}.html`,
    html_head: <Link />,
    html_body: <Word {...Props} />
  })
}
```

### 引用别名

定义一个显示图片的组件

```tsx title="./views/image.tsx"
import React from 'react'
export default () => <div className="show-image"></div>
```

创建一个 css 文件

> 图片位置./resources/exp.png

```css title="./resources/css/example.main.css"
.show-image {
  // 引入上级目录的图片资源
  background-image: url('../exp.png');
}
```

正常情况下，截图工具是无法识别 css 内部引用的其他资源的

- 资源的位置随便可能会因为插件位置的改变而改变

- 框架的设计变更也可能发生改变

- 生产的 html 文件随时会变化

此时，开发者需要借助别名系统，确保资源能正常被识别出来

```tsx
import { dirname, join } from 'path'
import { createRequire, render } from 'react-puppeteer'
import ImageComponent from './views/image.tsx'
const require = createRequire(import.meta.url)
export const ScreenshotOptions = {
  // 携带了别名的资源 效果等同 <head />
  html_files: [require('./resources/css/example.main.css')],
  // 设置别名
  file_paths: {
    // 定位自身的 md文件，并获取目录地址
    '@example': dirname(require('./README.md'))
  },
  // <head />
  html_head: <Link />
}
export const pictureRender = (uid: number, Props: Parameters<typeof ImageComponent>[0]) => {
  // 生成 html 地址 或 html字符串
  return render({
    // html/hello/uid.html
    join_dir: 'hello',
    html_name: `${uid}.html`,
    ...ScreenshotOptions,
    html_body: <ImageComponent {...Props} />
  })
}
```

```css title="./resources/css/example.main.css"
.show-image {
  // 在外部资源中使用别名引用
  background-image: url('@example/resources/exp.png');
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
import { createRequire, LinkCSS } from 'react-puppeteer'
const require = createRequire(import.meta.url)
export const Link = () => <LinkCSS src={require('./output.css')} />
```
