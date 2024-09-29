import { defineConfig } from 'alemonjs'
export default defineConfig({
  // 打包配置
  build: {
    // 入口
    input: './src/index.ts',
    // 输出目录
    ouput: 'lib'
  }
})
