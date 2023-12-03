import { ClientNTQQ } from '../../sdk/index.js'
import { ClientKOA } from '../../../koa/index.js'
import { everyoneError } from '../../../log/index.js'
/**
 * 回复控制器
 * @param msg
 * @param villa_id
 * @param room_id
 * @returns
 */
export async function replyController(
  msg: Buffer | string | number | (Buffer | number | string)[],
  guild_id: string,
  msg_id: string
) {
  // is buffer
  if (Buffer.isBuffer(msg)) {
    const url = await ClientKOA.getFileUrl(msg).catch(everyoneError)
    if (!url) return false
    return await ClientNTQQ.groupOpenMessages(guild_id, {
      content: '',
      media: {
        file_info: await ClientNTQQ.postRichMediaByGroup(guild_id, {
          srv_send_msg: false,
          file_type: 1,
          url
        })
          .then(res => res.file_info)
          .catch(everyoneError)
      },
      msg_id,
      msg_type: 7,
      msg_seq: ClientNTQQ.getMsgSeq(msg_id)
    }).catch(everyoneError)
  }

  if (Array.isArray(msg) && msg.find(item => Buffer.isBuffer(item))) {
    const isBuffer = msg.findIndex(item => Buffer.isBuffer(item))
    const cont = msg
      .map(item => {
        if (typeof item === 'number') return String(item)
        return item
      })
      .filter(element => typeof element === 'string')
      .join('')
    const url = await ClientKOA.getFileUrl(msg[isBuffer] as Buffer).catch(
      everyoneError
    )
    if (!url) return false
    return await ClientNTQQ.groupOpenMessages(guild_id, {
      content: cont,
      media: {
        file_info: await ClientNTQQ.postRichMediaByGroup(guild_id, {
          srv_send_msg: false,
          file_type: 1,
          url
        })
          .then(res => res.file_info)
          .catch(everyoneError)
      },
      msg_id,
      msg_type: 7,
      msg_seq: ClientNTQQ.getMsgSeq(msg_id)
    }).catch(everyoneError)
  }

  const content = Array.isArray(msg)
    ? msg.join('')
    : typeof msg === 'string'
    ? msg
    : typeof msg === 'number'
    ? `${msg}`
    : ''

  if (content == '') return false

  const match = content.match(/<http>(.*?)<\/http>/)
  if (match) {
    const getUrl = match[1]
    return await ClientNTQQ.groupOpenMessages(guild_id, {
      content: '',
      media: {
        file_info: await ClientNTQQ.postRichMediaByGroup(guild_id, {
          srv_send_msg: false,
          file_type: 1,
          url: getUrl
        })
          .then(res => res.file_info)
          .catch(everyoneError)
      },
      msg_id,
      msg_type: 7,
      msg_seq: ClientNTQQ.getMsgSeq(msg_id)
    }).catch(everyoneError)
  }

  return await ClientNTQQ.groupOpenMessages(guild_id, {
    content,
    msg_id,
    msg_type: 0,
    msg_seq: ClientNTQQ.getMsgSeq(msg_id)
  }).catch(everyoneError)
}
