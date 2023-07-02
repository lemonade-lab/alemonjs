import { createAlemon } from 'alemon-qq'
await createAlemon().catch(err => {
  console.log('启动失败~', err)
  return
})

// 监听退出,防止ts-node 退出报错
process.on('SIGINT', signals => {
  console.log(signals)
  if (process.pid) {
    process.exit()
  }
  return
})
