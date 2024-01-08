import axios, { type AxiosRequestConfig } from 'axios'
import { config } from './config.js'
import { ApiLog } from './log.js'

/**
 * KOOK服务
 * @param config
 * @returns
 */
export function Service(options: AxiosRequestConfig) {
  const token = config.get('token')
  const service = axios.create({
    baseURL: 'https://discord.com/api/v10',
    timeout: 6000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bot ${token}`
    }
  })
  return service(options)
}

/**
 * 鉴权
 * @returns
 */
export function gateway(): Promise<{
  url: string
}> {
  return Service({
    method: 'get',
    url: '/gateway'
  }).then(ApiLog)
}
