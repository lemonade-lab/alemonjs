import { start } from 'alemonjs'
start('lib/index.js')

// 进程子进程通讯
// 在这里调用。gloabl

// const events = {
//   online: () => {
//     //
//   },
//   onClient: (client) => {
//     global.client = client;
//   }
// }

// // 主进程的通信，获取所有的模块。
// process.on('message', event => {
//   if (events[event.type]) events[event.type](event.data)
// })
