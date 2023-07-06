import axios from 'axios'
import { BotConfigType } from 'alemon'
declare global {
  //机器人配置
  var cfg: BotConfigType
}
export function villaService(villa_id: number, config: object) {
  //打印方便查看发送的参数对不对
  console.log(config)
  const service = axios.create({
    baseURL: 'https://bbs-api.miyoushe.com',
    timeout: 20000,
    headers: {
      'x-rpc-bot_id': cfg.appID,
      'x-rpc-bot_secret': cfg.token,
      'x-rpc-bot_villa_id': villa_id // 别墅编号
    }
  })
  return service(config)
}
