import { createClient } from './lib/index.js'
const client = createClient(
  {
    bot_id: '', // 账号
    bot_secret: '', // 密码
    callback_url: '' // 回调地址
    // 比如 /api/mys/callback  即 http://ip:/api/mys/callback
  },
  callBack, // 回调接收函数
  async () => {
    console.log('欢迎使用~')
  }
)
async function callBack(event) {
  console.log('数据包', event)
  /** 已测 获取分组列表 */
  const list = client.getGroupList(event.robot.villa_id)
  console.log(list)
  return
}
