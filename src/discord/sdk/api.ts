import axios, { type AxiosRequestConfig } from 'axios'
import { getKookToken } from './config.js'

/**
 * KOOK服务
 * @param config
 * @returns
 */
export function Service(config: AxiosRequestConfig) {
  const token = getKookToken()
  const service = axios.create({
    baseURL: 'https://discord.com/api/v10',
    timeout: 6000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bot ${token}`
    }
  })
  return service(config)
}

export function gateway(): Promise<{
  url: string
}> {
  return Service({
    method: 'get',
    url: '/gateway'
  }).then(res => res.data)
}
