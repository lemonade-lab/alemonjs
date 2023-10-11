import { createBot, createApp } from './src/index.js'

// 创建机器人
const compilationTools = await createBot({
  mount: true // 独立开发启动
})

// 加载模块
const word = await compilationTools({
  aInput: `example/**/*.ts`,
  aOutput: `.apps/index.js`
})

// 创建应用
const app = createApp('bot')

// 设置模块
app.component(word)

// 挂载
app.mount('#app')
