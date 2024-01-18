import { ClientNTQQ } from '../sdk/index.js'
import { ClientKOA } from '../../koa/index.js'

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
): Promise<{
  middle: any[]
  backhaul: any
}> {
  // is buffer
  if (Buffer.isBuffer(msg)) {
    const url = await ClientKOA.getFileUrl(msg)
    if (!url) {
      return {
        middle: [],
        backhaul: false
      }
    }
    const file_info = await ClientNTQQ.postRichMediaByGroup(guild_id, {
      srv_send_msg: false,
      file_type: 1,
      url
    }).then(res => res?.file_info)
    if (!file_info) {
      return {
        middle: [],
        backhaul: false
      }
    }
    return {
      middle: [
        {
          url: file_info
        }
      ],
      backhaul: await ClientNTQQ.groupOpenMessages(guild_id, {
        content: '',
        media: {
          file_info
        },
        msg_id,
        msg_type: 7,
        msg_seq: ClientNTQQ.getMsgSeq(msg_id)
      })
    }
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
    const url = await ClientKOA.getFileUrl(msg[isBuffer] as Buffer)
    if (!url) {
      return {
        middle: [],
        backhaul: false
      }
    }
    const file_info = await ClientNTQQ.postRichMediaByGroup(guild_id, {
      srv_send_msg: false,
      file_type: 1,
      url
    }).then(res => res?.file_info)
    if (!file_info) {
      return {
        middle: [],
        backhaul: false
      }
    }
    return {
      middle: [
        {
          url: file_info
        }
      ],
      backhaul: await ClientNTQQ.groupOpenMessages(guild_id, {
        content: cont,
        media: {
          file_info
        },
        msg_id,
        msg_type: 7,
        msg_seq: ClientNTQQ.getMsgSeq(msg_id)
      })
    }
  }

  const content = Array.isArray(msg)
    ? msg.join('')
    : typeof msg === 'string'
    ? msg
    : typeof msg === 'number'
    ? `${msg}`
    : ''

  if (content == '') {
    return {
      middle: [],
      backhaul: false
    }
  }

  const match = content.match(/<http>(.*?)<\/http>/)
  if (match) {
    const getUrl = match[1]
    const file_info = await ClientNTQQ.postRichMediaByGroup(guild_id, {
      srv_send_msg: false,
      file_type: 1,
      url: getUrl
    }).then(res => res?.file_info)
    if (!file_info) {
      return {
        middle: [],
        backhaul: false
      }
    }
    return {
      middle: [
        {
          url: file_info
        }
      ],
      backhaul: await ClientNTQQ.groupOpenMessages(guild_id, {
        content: '',
        media: {
          file_info
        },
        msg_id,
        msg_type: 7,
        msg_seq: ClientNTQQ.getMsgSeq(msg_id)
      })
    }
  }

  return {
    middle: [],
    backhaul: await ClientNTQQ.groupOpenMessages(guild_id, {
      content,
      msg_id,
      msg_type: 0,
      msg_seq: ClientNTQQ.getMsgSeq(msg_id)
    })
  }
}
