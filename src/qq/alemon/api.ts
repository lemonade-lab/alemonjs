import { Readable } from 'stream'
import FormData from 'form-data'
import axios from 'axios'

import { getBotConfigByQQ } from '../config.js'

/**
 * 环境配置
 */
const Acf = {
  sandbox_api: 'https://sandbox.api.sgroup.qq.com',
  api: 'https://api.sgroup.qq.com'
}

/**
 * 得到环境api
 * @returns
 */
function getUrl(sandbox: boolean): string {
  /**
   * 沙箱环境
   */
  if (sandbox) return Acf.sandbox_api
  /**
   * 正式环境
   */
  return Acf.api
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
  const cfg = getBotConfigByQQ()
  const appID = cfg.appID
  const token = cfg.token
  const sandbox = cfg.sandbox
  /**
   * 得到环境
   */
  const urlbase = getUrl(sandbox)
  /**
   * 创建可读流对象
   */
  const picData = new Readable()
  picData.push(message.image)
  picData.push(null)

  /**
   * 构建请求数据包
   */
  const formdata = new FormData()
  formdata.append('msg_id', message.msg_id)
  if (typeof message.content === 'string') formdata.append('content', message.content)
  /**
   * 为上传的图片指定文件名
   * 指定上传的图片类型
   */
  formdata.append('file_image', picData, message.name ?? 'image.jpg')

  /**
   * 发送数据
   */
  return await axios({
    method: 'post',
    url: `${urlbase}/channels/${message.id}/messages`,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${formdata.getBoundary()}`,
      'Authorization': `Bot ${appID}.${token}`
    },
    data: formdata
  }).catch(err => console.log(err))
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
  const cfg = getBotConfigByQQ()
  const appID = cfg.appID
  const token = cfg.token
  const sandbox = cfg.sandbox
  /**
   * 得到环境
   */
  const urlbase = getUrl(sandbox)
  /**
   * 创建可读流对象
   */
  const picData = new Readable()
  picData.push(message.image)
  picData.push(null)

  /**
   * 构建请求数据包
   */
  const formdata = new FormData()
  formdata.append('msg_id', message.msg_id)
  if (typeof message.content === 'string') formdata.append('content', message.content)
  /**
   * 为上传的图片指定文件名
   * 指定上传的图片类型
   */
  formdata.append('file_image', picData, message.name ?? 'image.jpg')

  /**
   * 发送数据
   */
  return await axios({
    method: 'post',
    url: `${urlbase}/dms/${message.id}/messages`,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${formdata.getBoundary()}`,
      'Authorization': `Bot ${appID}.${token}`
    },
    data: formdata
  }).catch(err => console.log(err))
}
