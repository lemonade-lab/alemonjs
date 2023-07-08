import axios from 'axios'
import express, { Application } from 'express'
import bodyParser from 'body-parser'
import { getLocalImg } from './localimage.js'
import { ClientConfig } from './types.js'
const spiCfg: {
  bot_id: string
  bot_secret: string
} = {
  bot_id: '',
  bot_secret: ''
}
// 创建响应
const app: Application = express()
// 处理 POST 请求体中的 JSON 数据
app.use(express.json())
// 解析 x-www-form-urlencoded 格式的请求体
app.use(bodyParser.urlencoded({ extended: false }))
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
export function createClient(
  { bot_id, bot_secret, callback_url, img_rul = '/api/mys/img/:filename' }: ClientConfig,
  callBack: (req: express.Request, res: express.Response) => void
) {
  spiCfg.bot_id = bot_id
  spiCfg.bot_secret = bot_secret
  // 处理图片请求
  app.get(img_rul, getLocalImg)
  // 处理事件回调请求
  app.post(callback_url, callBack)
  return app
}
