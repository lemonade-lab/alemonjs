import { getBotConfig } from '../config.js'
import axios, { type AxiosRequestConfig } from 'axios'
import { API_SGROUP } from './config.js'
import { FileType, MsgType } from '../typings.js'
import { ApiLog } from '../log.js'

/**
 * 创建axios实例
 * @param config
 * @returns
 */
export async function GroupService(config: AxiosRequestConfig) {
  const appID = getBotConfig('appID')
  const token = getBotConfig('token')
  const service = await axios.create({
    baseURL: API_SGROUP,
    timeout: 20000,
    headers: {
      'X-Union-Appid': appID,
      'Authorization': `QQBot ${token}`
    }
  })
  return service(config)
}

/**
 * 得到鉴权
 * @returns
 */
export async function gateway() {
  return GroupService({
    url: '/gateway'
  })
    .then(res => res.data)
    .then(data => {
      const { url } = data
      if (url) {
        return url
      } else {
        console.error('http err:', null)
      }
    })
    .catch(error => {
      console.error('token err:', error.message)
    })
}

/**
 * 发送私聊消息
 * @param openid
 * @param content
 * @param msg_id
 * @returns
 *   0 文本  1 图文 2 md 3 ark 4 embed
 */
export async function usersOpenMessages(
  openid: string,
  data: {
    content?: string
    msg_type: MsgType
    markdown?: any
    keyboard?: any
    media?: any
    ark?: any
    image?: any
    message_reference?: any
    event_id?: any
    msg_id?: string
    msg_seq?: number
  },
  msg_id?: string
): Promise<{ id: string; timestamp: number }> {
  return GroupService({
    url: `/v2/users/${openid}/messages`,
    method: 'post',
    data: data
  }).then(ApiLog)
}

// /\[🔗[^\]]+\]\([^)]+\)|@everyone/.test(content)

// map会越来越大,应该自动delte第一个key
const map = {}
export function getMsgSeq(MsgId: string) {
  if (Object.prototype.hasOwnProperty.call(map, MsgId)) {
    map[MsgId] = map[MsgId] + 1
  } else {
    map[MsgId] = 1
  }
  const arr = Object.keys(map)
  if (arr.length > 15) {
    const firstKey = arr[0]
    delete map[firstKey]
  }
  return map[MsgId]
}

/**
 * 发送群聊消息
 * @param group_openid
 * @param content
 * @param msg_id
 * @returns
 */
export async function groupOpenMessages(
  group_openid: string,
  data: {
    content?: string
    msg_type: MsgType
    markdown?: any
    keyboard?: any
    media?: any
    ark?: any
    image?: any
    message_reference?: any
    event_id?: any
    msg_id?: string
    msg_seq?: number
  }
): Promise<{ id: string; timestamp: number }> {
  return GroupService({
    url: `/v2/groups/${group_openid}/messages`,
    method: 'post',
    data: data
  }).then(ApiLog)
}

// markdown = {content}
//

/**
 * 发送私聊富媒体文件
 * @param openid
 * @param content
 * @param file_type
 * @returns
 *  1 图文 2 视频 3 语言 4 文件
 * 图片：png/jpg，视频：mp4，语音：silk
 */
export async function postRichMediaByUsers(
  openid: string,
  data: {
    srv_send_msg: boolean
    file_type: FileType
    url: string
    file_data?: any
  }
): Promise<{ file_uuid: string; file_info: string; ttl: number }> {
  return GroupService({
    url: `/v2/users/${openid}/files`,
    method: 'post',
    data: data
  }).then(ApiLog)
}

/**
 * 发送群里文件
 * @param openid
 * @param content
 * @param file_type
 * @returns
 *  1 图文 2 视频 3 语言 4 文件
 * 图片：png/jpg，视频：mp4，语音：silk
 */
export async function postRichMediaByGroup(
  openid: string,
  data: {
    srv_send_msg: boolean
    file_type: FileType
    url: string
    file_data?: any
  }
): Promise<{ file_uuid: string; file_info: string; ttl: number }> {
  return GroupService({
    url: `/v2/groups/${openid}/files`,
    method: 'post',
    data: data
  }).then(ApiLog)
}
