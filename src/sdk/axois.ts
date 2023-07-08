import axios from 'axios'
import { BotConfigType } from 'alemon'
declare global {
  //机器人配置
  var cfg: BotConfigType
}
/**
 * 别野服务
 * @param villa_id 别野编号
 * @param config 配置
 * @returns
 */
export function villaService(villa_id: number, config: object) {
  // 打印方便查看发送的参数
  console.log(config)
  const service = axios.create({
    baseURL: 'https://bbs-api.miyoushe.com', // 地址
    timeout: 20000, // 响应
    headers: {
      'x-rpc-bot_id': cfg.appID, // 账号
      'x-rpc-bot_secret': cfg.token, // 密码
      'x-rpc-bot_villa_id': villa_id // 别墅编号
    }
  })
  return service(config)
}
