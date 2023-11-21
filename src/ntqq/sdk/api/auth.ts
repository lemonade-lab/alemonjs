import axios from 'axios'

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
