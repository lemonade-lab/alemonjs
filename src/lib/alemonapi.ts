import { createReadStream, PathLike } from 'fs'
import { Readable } from 'stream'
import FormData from 'form-data'
import axios from 'axios'

import { Acf } from '../../app.config'
import { BotConfigType } from 'alemon/types'

declare global {
  var cfg: BotConfigType
}
/**
 * 得到环境api
 * @returns
 */
const getUrl = () => {
  //沙箱环境
  if (cfg.sandbox) return Acf.sandbox_api
  //正式环境
  return Acf.api
}

/**
 * 发送本地路径的图片
 * @param id 私信传频道id,公信传子频道id
 * @param message
 * @returns
 */
export async function sendImage(
  id: string,
  message: {
    msg_id: string
    file_image: PathLike
    content?: string
  },
  isGroup: boolean
) {
  const urlbase = getUrl()

  /** 读取本地图片地址 */
  let picData = createReadStream(message.file_image)

  /* 请求数据包 */
  let formdata = new FormData()
  formdata.append('msg_id', message.msg_id)
  if (typeof message.content === 'string') formdata.append('content', message.content)
  formdata.append('file_image', picData)

  let url = ``
  if (!isGroup) {
    url = `${urlbase}/channels/${id}/messages`
  } else {
    url = `${urlbase}/dms/${id}/messages`
  }

  /* 采用请求方式发送数据 */
  return axios({
    method: 'post',
    url,
    headers: {
      'Content-Type': formdata.getHeaders()['content-type'],
      'Authorization': `Bot ${cfg.appID}.${cfg.token}`
    },
    data: formdata
  }).catch((err: any) => console.error(err))
}

/**
 * 发送Buffer类型的图片
 * @param id
 * @param message
 * @returns
 */
export async function postImage(
  id: string,
  message: {
    msg_id: string
    file_image: PathLike
    content?: string
  },
  isGroup: boolean
) {
  const urlbase = getUrl()
  /* 创建可读流对象 */
  const picData = new Readable()
  picData.push(message.file_image)
  picData.push(null)

  /* 构建请求数据包 */
  const formdata = new FormData()
  formdata.append('msg_id', message.msg_id)
  if (typeof message.content === 'string') formdata.append('content', message.content)
  formdata.append('file_image', picData, {
    filename: 'image.jpg', // 为上传的图片指定文件名，可以根据实际情况修改
    contentType: 'image/jpeg' // 指定上传的图片类型，可以根据实际情况修改
  })

  let url = ``
  if (!isGroup) {
    url = `${urlbase}/channels/${id}/messages`
  } else {
    url = `${urlbase}/dms/${id}/messages`
  }

  /* 采用请求方式发送数据 */
  return axios({
    method: 'post',
    url,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${formdata.getBoundary()}`,
      'Authorization': `Bot ${cfg.appID}.${cfg.token}`
    },
    data: formdata
  }).catch((err: any) => console.error(err))
}
