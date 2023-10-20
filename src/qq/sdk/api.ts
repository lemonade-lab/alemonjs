import { Readable } from 'stream'
import FormData from 'form-data'
import axios, { AxiosRequestConfig } from 'axios'
import { getBotConfig } from './config.js'
/**
 * 创建axios实例
 * @param config
 * @returns
 */
export async function requestService(config: AxiosRequestConfig) {
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
  const formdata = createFrom(
    message.image,
    message.msg_id,
    message.content,
    message.name
  )
  return requestService({
    method: 'post',
    url: `/channels/${message.id}/messages`,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${formdata.getBoundary()}`
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
  const formdata = createFrom(
    message.image,
    message.msg_id,
    message.content,
    message.name
  )
  return requestService({
    method: 'post',
    url: `/dms/${message.id}/messages`,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${formdata.getBoundary()}`
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
function createFrom(image, msg_id, content, name = 'image.jpg') {
  /**
   * 创建可读流对象
   */
  const picData = new Readable()
  picData.push(image)
  picData.push(null)
  /**
   * 构建请求数据包
   */
  const formdata = new FormData()
  formdata.append('msg_id', msg_id)
  if (typeof content === 'string') formdata.append('content', content)
  /**
   * 为上传的图片指定文件名
   * 指定上传的图片类型
   */
  formdata.append('file_image', picData, name)
  return formdata
}
