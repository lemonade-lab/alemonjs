import FormData from 'form-data'
import axios, { AxiosRequestConfig } from 'axios'
import { getBotConfig } from '../config.js'
import { createPicFrom } from '../../../core/index.js'
import { API_SGROUP_SANDBOX, API_SGROUP } from './config.js'

/**
 * 创建axios实例
 * @param config
 * @returns
 */
export async function GuildServer(config: AxiosRequestConfig) {
  const token = getBotConfig('token')
  const sandbox = getBotConfig('sandbox')
  const appID = getBotConfig('appID')
  const service = await axios.create({
    baseURL: sandbox ? API_SGROUP_SANDBOX : API_SGROUP,
    timeout: 20000,
    headers: {
      Authorization: `Bot ${appID}.${token}`
    }
  })
  return service(config)
}

/**
 * 发送buffer图片
 * @param id 私信传频道id,公信传子频道id
 * @param message {消息编号,图片,内容}
 * @param isGroup 是否是群聊
 * @returns
 */
export async function postImage(message: {
  id: string
  msg_id: string
  image: Buffer
  content?: string
  name?: string
}): Promise<any> {
  const formdata = await createFrom(
    message.image,
    message.msg_id,
    message.content,
    message.name
  )
  const dary = formdata != false ? formdata.getBoundary() : ''
  return GuildServer({
    method: 'post',
    url: `/channels/${message.id}/messages`,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${dary}`
    },
    data: formdata
  })
}
/**
 * 私聊发送buffer图片
 * @param id 私信传频道id,公信传子频道id
 * @param message {消息编号,图片,内容}
 * @returns
 */
export async function postDirectImage(message: {
  id: string
  msg_id: string
  image: Buffer
  content?: string
  name?: string
}): Promise<any> {
  const formdata = await createFrom(
    message.image,
    message.msg_id,
    message.content,
    message.name
  )
  const dary = formdata != false ? formdata.getBoundary() : ''
  return GuildServer({
    method: 'post',
    url: `/dms/${message.id}/messages`,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${dary}`
    },
    data: formdata
  })
}

/**
 * 创建form
 * @param image
 * @param msg_id
 * @param content
 * @param name
 * @returns
 */
async function createFrom(image, msg_id, content, Name = 'image.jpg') {
  const from = await createPicFrom(image, Name)
  if (!from) return false
  const { picData, name } = from
  const formdata = new FormData()
  formdata.append('msg_id', msg_id)
  if (typeof content === 'string') formdata.append('content', content)
  formdata.append('file_image', picData, name)
  return formdata
}
