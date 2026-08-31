import { defineConfig } from 'lvyjs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  watch: ['src/**/*.{ts,tsx,js,jsx,json,html}'],
  alias: {
    entries: [{ find: '@src', replacement: join(__dirname, 'src') }]
  },
  assets: {
    // 支持图片、字体、文本等静态资源
    filter: /\.(png|jpg|jpeg|gif|svg|webp|ico|yaml|txt|ttf|md)$/
  },
  build: {
    // 是否生成声明文件
    dts: false
  }
});
