import express, { Application, Request, Response } from 'express'
import bodyParser from 'body-parser'
import axios from 'axios'
import { getLocalImg } from './img.js'
import { ClientConfig, BotEvent } from './types.js'
import * as Client from './all.js'
import { getClientConfig, setClientConfig } from './config.js'
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
  console.log('config=', config)
  const ClientCfg = getClientConfig()
  const service = axios.create({
    baseURL: 'https://bbs-api.miyoushe.com', // 地址
    timeout: 20000, // 响应
    headers: {
      'x-rpc-bot_id': ClientCfg.bot_id, // 账号
      'x-rpc-bot_secret': ClientCfg.bot_secret, // 密码
      'x-rpc-bot_villa_id': villa_id // 别墅编号
    }
  })
  return service(config)
}
/**
 * 创建客户端
 * @param bot_id
 * @param bot_secret
 */
export function createClient(
  {
    bot_id,
    bot_secret,
    callback_url,
    callback_host = 8080,
    img_rul = '/api/mys/img/:filename',
    IMAGE_DIR = 'data/mys/img'
  }: ClientConfig,
  callBack: (event: BotEvent) => Promise<void>,
  logFnc?: () => Promise<void>
) {
  /** 设置配置 */
  setClientConfig({
    bot_id,
    bot_secret,
    callback_url,
    callback_host,
    img_rul,
    IMAGE_DIR
  })
  // 处理图片请求
  app.get(img_rul, getLocalImg)
  // 处理事件回调请求
  app.post(callback_url, async (req: Request, res: Response) => {
    try {
      // 从请求体中获取事件对象
      const event: BotEvent = req.body.event
      /** 错误调用  */
      if (!event || !event.robot) {
        console.log('错误调用~')
        // 处理完毕后返回响应
        res.status(200).json({ message: '错误调用', retcode: 0 })
        return
      }
      await callBack(event).catch(err => {
        console.log(err)
        return
      })
    } catch (err) {
      console.log(err)
      // 处理完毕后返回响应
      res.status(200).json({ message: '执行错误', retcode: 0 })
      return
    }
    // 处理完毕后返回响应
    res.status(200).json({ message: '处理完成', retcode: 0 })
    return
  })
  app.listen(callback_host, logFnc)
  return Client
}
export { Client }
export * from './types.js'
