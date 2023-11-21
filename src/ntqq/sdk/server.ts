import axios, { AxiosRequestConfig } from 'axios'
import { getBotConfig } from './config.js'

/**
 * 得到鉴权
 * @param appId
 * @param clientSecret
 * @param url
 * @returns
 */
export function getAuthentication(appId: string, clientSecret: string) {
  return axios.post('https://bots.qq.com/app/getAppAccessToken', {
    appId: appId,
    clientSecret: clientSecret
  })
}

/**
 * 创建axios实例
 * @param config
 * @returns
 */
export async function Service(config: AxiosRequestConfig) {
  const { token } = getBotConfig()
  const service = await axios.create({
    baseURL: 'https://api.sgroup.qq.com',
    timeout: 20000,
    headers: {
      Authorization: `QQBot ${token}`
    }
  })
  return service(config)
}
