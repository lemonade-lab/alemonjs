process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
import { createBot } from './src/index.js'
import { createApp, compilationTools } from 'alemon'
// 创建机器人
await createBot(process.argv.slice(2))
  .then(alemon => alemon(false))
  .catch(err => {
    console.log('出错啦', err)
  })

// 加载模块
const alemon = await compilationTools({
  input: `example/**/*.ts`,
  file: `example.js`,
  external: ['alemon'] // 忽视提示
})

// 创建应用
const app = createApp('alemon')
// 设置模块
app.component(alemon)
// 挂载
app.mount('#app')

// /**
//  * 插件模式启动
//  */
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
// import { createBot } from './src/index.js'
// await createBot(process.argv.slice(2))
//   .then(alemon => alemon())
//   .catch(err => {
//     console.log('出错啦', err)
//   })
