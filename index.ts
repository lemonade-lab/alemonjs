import { createBot, createApp, compilationTools } from './src/index.js'
import config from './config.js'

// 创建机器人
await createBot({
  mount: true // 独立开发启动
})

// 加载模块
const example = await compilationTools(config)

// 创建应用
const app = createApp('example')

// 设置模块
app.component(example)

// 挂载
app.mount('#app')
