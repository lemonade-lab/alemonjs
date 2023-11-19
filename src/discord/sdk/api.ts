import { AxiosRequestConfig } from 'axios'
import { Service } from './base.js'
import FormData from 'form-data'
import { createPicFrom } from '../../core/index.js'
export * from './cdn.js'
export * from './base.js'

/**
 * 得到应用详细信息
 * @returns
 */
export function applicationsMe() {
  return Service({
    method: 'get',
    url: '/applications/@me'
  }).then(res => res.data)
}

/**
 *
 * @param user_id
 * @param avatar_hash
 * @returns
 */
export function channelsMessages(
  channel_id: string,
  data: {
    content?: string
    tts?: boolean
    embeds?: {
      title?: string
      description?: string
    }[]
    files?: any[]
  },
  headers?: AxiosRequestConfig['headers']
) {
  return Service({
    url: `channels/${channel_id}/messages`,
    method: 'post',
    headers: headers,
    data
  }).then(res => res.data)
}

/**
 *
 * @param channel_id
 * @param img
 * @returns
 */
export async function channelsMessagesImage(
  channel_id: string,
  img: any,
  content?: string
) {
  const from = await createPicFrom(img)
  if (!from) return
  const { picData, name } = from
  const formData = new FormData()
  if (content) {
    formData.append('content', content)
  }
  formData.append('file', picData, name)
  return Service({
    method: 'post',
    url: `channels/${channel_id}/messages`,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
