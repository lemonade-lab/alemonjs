import axios, { type AxiosRequestConfig } from 'axios'
import FormData from 'form-data'
import { Readable } from 'stream'
import {
  ApiEnum,
  SendMessageParams,
  BotInformation,
  SendDirectMessageParams
} from './typings.js'
import { getKookToken } from './config.js'
import { createPicFrom } from '../../core/index.js'

/**
 * KOOK服务
 * @param config
 * @returns
 */
export function kookService(config: AxiosRequestConfig) {
  const token = getKookToken()
  const service = axios.create({
    baseURL: 'https://www.kookapp.cn',
    timeout: 30000,
    headers: {
      Authorization: `Bot ${token}`
    }
  })
  return service(config)
}

/**
 * ************
 * 资源床单
 * ***********
 */

/**
 * 发送buffer资源
 * @param id 私信传频道id,公信传子频道id
 * @param message {消息编号,图片,内容}
 * @returns
 */
export async function postImage(
  file: string | Buffer | Readable,
  Name = 'image.jpg'
) {
  const from = await createPicFrom(file, Name)
  if (!from) return false
  const { picData, name } = from
  const formdata = new FormData()
  formdata.append('file', picData, name)
  const url = await createUrl(formdata)
  if (url) return url
  return false
}

/**
 * 转存
 * @param formdata
 * @returns
 */
export async function createUrl(formdata): Promise<{
  data: { url: string }
}> {
  return await kookService({
    method: 'post',
    url: ApiEnum.AssetCreate,
    data: formdata,
    headers: formdata.getHeaders()
  }).then(res => res.data)
}

/**
 * *********
 * 消息api
 * *********
 */

/**
 * 创建消息
 * @param data
 * @returns
 */
export async function createMessage(data: SendMessageParams): Promise<{
  data: {
    msg_id: string
    msg_timestamp: number
    nonce: string
  }
}> {
  return await kookService({
    method: 'post',
    url: ApiEnum.MessageCreate,
    data
  }).then(res => res.data)
}

/**
 * 创建私聊消息
 */

/**
 * 创建消息
 * @param data
 * @returns
 */
export async function createDirectMessage(
  data: SendDirectMessageParams
): Promise<{
  data: {
    msg_id: string
    msg_timestamp: number
    nonce: string
  }
}> {
  return kookService({
    method: 'post',
    url: ApiEnum.DirectMessageCreate,
    data
  }).then(res => res.data)
}

/**
 * **********
 * user
 * *********
 */

/**
 * 得到当前信息
 * @param guild_id
 * @param user_id
 * @returns
 */
export async function userMe(): Promise<{
  code: number
  message: string
  data: {
    id: string
    username: string
    identify_num: string
    online: false
    os: string
    status: number
    avatar: string
    banner: string
    bot: true
    mobile_verified: true
    client_id: string
    mobile_prefix: string
    mobile: string
    invited_count: number
  }
}> {
  return kookService({
    method: 'get',
    url: ApiEnum.UserMe
  }).then(res => res.data)
}

/**
 * 得到用户信息
 * @param guild_id
 * @param user_id
 * @returns
 */
export async function userView(
  guild_id: string,
  user_id: string
): Promise<{
  code: number
  message: string
  data: {
    id: string
    username: string
    identify_num: string
    online: false
    status: 0
    bot: true
    avatar: string
    vip_avatar: string
    mobile_verified: true
    roles: number[]
    joined_at: number
    active_time: number
  }
}> {
  return kookService({
    method: 'get',
    url: ApiEnum.UserView,
    params: {
      guild_id,
      user_id
    }
  }).then(res => res.data)
}

/**
 * 踢出
 * @param guild_id
 * @param user_id
 * @returns
 */
export async function guildKickout(
  guild_id: string,
  user_id: string
): Promise<{
  code: number
  message: string
  data: any
}> {
  return kookService({
    method: 'post',
    url: ApiEnum.GuildKickout,
    data: {
      guild_id,
      target_id: user_id
    }
  }).then(res => res.data)
}
