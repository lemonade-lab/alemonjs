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
 * 发送私聊图片
 * @param openid
 * @param content
 * @returns
 */
export async function postFilesByUsers(
  openid: string,
  content: string
): Promise<{ id: string; timestamp: number }> {
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
  }).then(res => res.data)
}

/**
 * 发送群聊图片
 * @param openid
 * @param content
 * @returns
 */
export async function postFilesByGroup(
  openid: string,
  content: string
): Promise<{ id: string; timestamp: number }> {
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
  }).then(res => res.data)
}

/**
 * 发送私聊消息
 * @param openid
 * @param content
 * @param msg_id
 * @returns
 */
export async function postMessageByUser(
  openid: string,
  content: string,
  msg_id?: string
): Promise<{ id: string; timestamp: number }> {
  const { appID } = getBotConfig()
  // 判断是否是md
  if (/\[🔗[^\]]+\]\([^)]+\)|@everyone/.test(content)) {
    // md
    return requestService({
      url: `/v2/users/${openid}/messages`,
      method: 'post',
      headers: {
        'X-Union-Appid': appID
      },
      data: {
        msg_id: msg_id,
        markdown: { content },
        msg_type: 2 //  0 文本  1 图文 2 md 3 ark 4 embed
      }
    }).then(res => res.data)
  } else {
    return requestService({
      url: `/v2/users/${openid}/messages`,
      method: 'post',
      headers: {
        'X-Union-Appid': appID
      },
      data: {
        content: content,
        msg_id: msg_id,
        msg_type: 0 //  0 文本  1 图文 2 md 3 ark 4 embed
      }
    }).then(res => res.data)
  }
}

/**
 * 发送群聊消息
 * @param group_openid
 * @param content
 * @param msg_id
 * @returns
 */
export async function postMessageByGroup(
  group_openid: string,
  content: string,
  msg_id?: string
): Promise<{ id: string; timestamp: number }> {
  const { appID } = getBotConfig()
  // 判断是否是md
  if (/\[[^\]]+\]\([^)]+\)|@everyone/.test(content)) {
    // md
    return requestService({
      url: `/v2/groups/${group_openid}/messages`,
      method: 'post',
      headers: {
        'X-Union-Appid': appID
      },
      data: {
        content: 'md',
        msg_id: msg_id,
        markdown: { content },
        msg_type: 2, //  0 文本  1 图文 2 md 3 ark 4 embed
        timestamp: Math.floor(Date.now() / 1000)
      }
    }).then(res => res.data)
  } else {
    return requestService({
      url: `/v2/groups/${group_openid}/messages`,
      method: 'post',
      headers: {
        'X-Union-Appid': appID
      },
      data: {
        content: content,
        msg_id: msg_id,
        msg_type: 0, //  0 文本  1 图文 2 md 3 ark 4 embed
        timestamp: Math.floor(Date.now() / 1000)
      }
    }).then(res => res.data)
  }
}

/**
 * 发送私聊富媒体消息
 * @param openid
 * @param content
 * @param file_type
 * @returns
 *  1 图文 2 视频 3 语言 4 文件
 * 图片：png/jpg，视频：mp4，语音：silk
 */
export async function postRichMediaByUsers(
  openid: string,
  content: string,
  file_type: 1 | 2 | 3 | 4
): Promise<{ id: string; timestamp: number }> {
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
      file_type: file_type //    1 图文 2 视频 3 语言 4 文件
    }
  }).then(res => res.data)
}

/**
 * 发送群聊图片
 * @param openid
 * @param content
 * @param file_type
 * @returns
 *  1 图文 2 视频 3 语言 4 文件
 * 图片：png/jpg，视频：mp4，语音：silk
 */
export async function postRichMediaByGroup(
  openid: string,
  content: string,
  file_type: 1 | 2 | 3 | 4
): Promise<{ id: string; timestamp: number }> {
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
      file_type: file_type
    }
  }).then(res => res.data)
}
