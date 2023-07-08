import axios from 'axios'
const spiCfg: {
  bot_id: string
  bot_secret: string
} = {
  bot_id: '',
  bot_secret: ''
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
      'x-rpc-bot_id': spiCfg.bot_id, // 账号
      'x-rpc-bot_secret': spiCfg.bot_secret, // 密码
      'x-rpc-bot_villa_id': villa_id // 别墅编号
    }
  })
  return service(config)
}
/**
 * 创建请求程序
 * @param bot_id
 * @param bot_secret
 */
export function createClient(bot_id, bot_secret) {
  spiCfg.bot_id = bot_id
  spiCfg.bot_secret = bot_secret
}
