import { defineConfig } from 'alemonjs'
// import xiuxian from '@alemonjs/app/xiuxian'
export default defineConfig({
  // 可监听的配置文件
  configDir: 'alemon.config.yaml',
  // 动态加载的配置文件
  moduleDir: 'alemon.config.json',
  // 也可以在这里配置
  module: {
    // app: ['xiuxian', xiuxian()]
  }
})
