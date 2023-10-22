import axios from 'axios'
import FormData from 'form-data'
import { existsSync, createReadStream } from 'fs'
import { Readable, isReadable } from 'stream'
import { basename } from 'path'
import { fileTypeFromBuffer, fileTypeFromStream } from 'file-type'
import { ApiEnum, SendMessageParams, BotInformation, SendDirectMessageParams } from './typings.js'
import { getKookToken } from './config.js'

/**
 * KOOK服务
 * @param config
 * @returns
 */
export function kookService(config: object) {
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
export async function postImage(file: string | Buffer | Readable, name = 'image.jpg') {
  let picData: Readable | Buffer[]
  if (typeof file === 'string') {
    if (!existsSync(file)) {
      return false
    }
    if (!name) {
      name = basename(file)
    }
    picData = createReadStream(file)
  } else if (Buffer.isBuffer(file)) {
    if (!name) {
      name = 'file.' + (await fileTypeFromBuffer(file)).ext
    }
    picData = new Readable()
    picData.push(file)
    picData.push(null)
  } else if (isReadable(file)) {
    if (!name) {
      name = 'file.' + (await fileTypeFromStream(file)).ext
    }
    picData = file
  } else {
    return false
  }
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
export async function createUrl(formdata) {
  const ret: { url: string } | false = await kookService({
    method: 'post',
    url: ApiEnum.AssetCreate,
    data: formdata,
    headers: formdata.getHeaders()
  })
    .then(res => {
      const re = res.data
      return re.data
    })
    .catch(err => {
      console.error(err)
      return false
    })
  if (!ret) {
    return false
  }
  return ret.url
}

/**
 * *********
 * 用户api
 * **********
 */

export async function getBotInformation() {
  const ret: BotInformation | false = await kookService({
    method: 'post',
    url: ApiEnum.UserMe
  })
    .then(res => {
      const re = res.data
      return re.data
    })
    .catch(err => {
      console.error(err)
      return false
    })

  return ret
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
export async function createMessage(data: SendMessageParams) {
  const ret: {
    msg_id: string
    msg_timestamp: number
    nonce: string
  } = await kookService({
    method: 'post',
    url: ApiEnum.MessageCreate,
    data
  })
    .then(res => {
      const re = res.data
      return re.data
    })
    .catch(err => {
      console.error(err)
      return false
    })
  return ret
}

/**
 * 创建私聊消息
 */

/**
 * 创建消息
 * @param data
 * @returns
 */
export async function createDirectMessage(data: SendDirectMessageParams) {
  const ret: {
    msg_id: string
    msg_timestamp: number
    nonce: string
  } = await kookService({
    method: 'post',
    url: ApiEnum.DirectMessageCreate,
    data
  })
    .then(res => {
      const re = res.data
      return re.data
    })
    .catch(err => {
      console.error(err)
      return false
    })
  return ret
}
