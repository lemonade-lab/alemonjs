import { createAlemon } from './src/index.js'
/** 创建机器人 */
await createAlemon().catch(err => {
  console.log(err)
  return false
})
