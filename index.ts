import { createAlemon } from 'alemon-qq'
createAlemon()

// 监听退出,防止ts-node 退出报错
process.on('SIGINT', signals => console.log(signals))
