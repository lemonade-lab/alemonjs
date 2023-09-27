import axios, { AxiosRequestConfig } from 'axios'
import { getBotConfig } from './config.js'

let aut
export function setAuthentication(val: string) {
  aut = val
}

/**
 * 得到鉴权
 * @param appId
 * @param clientSecret
 * @param url
 * @returns
 */
export function getAuthentication(appId: string, clientSecret: string) {
  return axios.post(aut ?? 'https://bots.qq.com/app/getAppAccessToken', {
    appId: appId,
    clientSecret: clientSecret
  })
}

/**
 * 创建axios实例
 * @param config
 * @returns
 */
export async function requestService(config: AxiosRequestConfig) {
  const { token } = getBotConfig()
  console.log(config)
  const service = await axios.create({
    baseURL: 'https://api.sgroup.qq.com',
    timeout: 20000,
    headers: {
      Authorization: `QQBot ${token}`
    }
  })
  return service(config)
}

/**
 * 发送图片
 * @param openid
 * @param content
 * @returns
 */
export async function postFilesByUsers(openid: string, content: string): Promise<any> {
  const { appID } = getBotConfig()
  return requestService({
    url: `/v2/users/${openid}/files`,
    method: 'post',
    headers: {
      'X-Union-Appid': appID
    },
    data: {
      srv_send_msg: true,
      url: content,
      file_type: 1 //    1 图文 2 视频 3 语言 4 文件
    }
  })
}

/**
 * 发送群聊图片
 * @param openid
 * @param content
 * @returns
 */
export async function postFilesByGroup(openid: string, content: string): Promise<any> {
  const { appID } = getBotConfig()
  return requestService({
    url: `/v2/groups/${openid}/files`,
    method: 'post',
    headers: {
      'X-Union-Appid': appID
    },
    data: {
      srv_send_msg: true,
      url: content,
      file_type: 1 //    1 图文 2 视频 3 语言 4 文件
    }
  })
}

/**
 * 发送私聊消息
 * @param openid
 * @param content
 * @returns
 */
export async function postMessageByUser(openid: string, content: string) {
  const { appID } = getBotConfig()
  return requestService({
    url: `/v2/users/${openid}/messages`,
    method: 'post',
    headers: {
      'X-Union-Appid': appID
    },
    data: {
      content: 'md',
      markdown: { content },
      msg_type: 2 //  0 文本  1 图文 2 md 3 ark 4 embed
    }
  })
}

/**
 * 发送群聊消息
 * @param openid
 * @param content
 * @returns
 */
export async function postMessageByGroup(group_openid: string, content: string) {
  const { appID } = getBotConfig()
  return requestService({
    url: `/v2/groups/${group_openid}/messages`,
    method: 'post',
    headers: {
      'X-Union-Appid': appID
    },
    data: {
      content: 'md',
      markdown: { content },
      msg_type: 2, //  0 文本  1 图文 2 md 3 ark 4 embed
      timestamp: Math.floor(Date.now() / 1000)
    }
  })
}
