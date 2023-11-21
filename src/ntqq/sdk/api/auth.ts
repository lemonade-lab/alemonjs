import axios from 'axios'
import { API_BOTS } from './config.js'

/**
 * 得到鉴权
 * @param appId
 * @param clientSecret
 * @param url
 * @returns
 */
export function getAuthentication(appId: string, clientSecret: string) {
  return axios.post(`${API_BOTS}/app/getAppAccessToken`, {
    appId: appId,
    clientSecret: clientSecret
  })
}
