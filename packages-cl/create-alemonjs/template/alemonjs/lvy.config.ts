import { defineConfig } from 'lvyjs';
import tailwindcss from 'lvyjs-plugin-tailwindcss';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  env: process.env,
  plugins: [
    // 处理 TailwindCSS
    tailwindcss()
  ],
  watch: [
    'src/**/*.{ts,tsx,js,jsx,json,html}'
  ],
  alias: {
    entries: [{ find: '@src', replacement: join(__dirname, 'src') }]
  },
  assets: {
    // 过滤得到指定格式的文件识别之为静态资源
    filter: /\.(png|jpg|jpeg|gif|svg|webp|ico|yaml|txt|ttf)$/
  },
  build: {
    // dts: true
  }
});