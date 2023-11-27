import axios, { type AxiosRequestConfig } from 'axios'
import { getDISCORD } from './config.js'
const BaseUrl = 'https://cdn.discordapp.com'
export function ServiceApp(config: AxiosRequestConfig) {
  const { token } = getDISCORD()
  const service = axios.create({
    baseURL: BaseUrl,
    timeout: 6000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bot ${token}`
    }
  })
  return service(config)
}

/**
 * 创建用户url地址
 * @param user_id
 * @param avatar_hash
 * @returns
 */
export function UserAvatar(user_id: string, avatar_hash: string) {
  return `${BaseUrl}/avatars/${user_id}/${avatar_hash}.png`
}

/**
 *
 * @param user_id
 * @param avatar_hash
 * @returns
 */
export function getUserUrl(user_id: string, avatar_hash: string) {
  const url = `/avatars/${user_id}/${avatar_hash}.png`
  return ServiceApp({
    url: url,
    method: 'get'
  }).then(res => res.data)
}