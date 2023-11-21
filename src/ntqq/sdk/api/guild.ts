import FormData from 'form-data'
import axios, { AxiosRequestConfig } from 'axios'
import { getBotConfig } from '../config.js'
import { createPicFrom } from '../../../core/index.js'

/**
 * 创建axios实例
 * @param config
 * @returns
 */
export async function GuildServer(config: AxiosRequestConfig) {
  const { appID, token, sandbox } = getBotConfig()
  const service = await axios.create({
    baseURL: sandbox
      ? 'https://sandbox.api.sgroup.qq.com'
      : 'https://api.sgroup.qq.com',
    timeout: 20000,
    headers: {
      Authorization: `Bot ${appID}.${token}`
    }
  })
  return service(config)
}

/**
 * 得到鉴权
 * @returns
 */
export async function gateway() {
  return GuildServer({
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
