import { readFileSync } from 'fs'
import { QQBotAPI } from '../sdk/api'
import { type DataEnums } from 'alemonjs'
import axios from 'axios'

type Client = typeof QQBotAPI.prototype

export const GROUP_AT_MESSAGE_CREATE = (client: Client, event, val: DataEnums[]) => {
  const content = val
    .filter(item => item.type == 'Link' || item.type == 'Mention' || item.type == 'Text')
    .map(item => {
      if (item.type == 'Link') {
        return `[${item.options?.title ?? item.value}](${item.value})`
      } else if (item.type == 'Mention') {
        if (
          item.value == 'everyone' ||
          item.value == 'all' ||
          item.value == '' ||
          typeof item.value != 'string'
        ) {
          return ``
        }
        if (item.options?.belong == 'user') {
          return `<@${item.value}>`
        }
        return ''
      } else if (item.type == 'Text') {
        return item.value
      }
    })
    .join('')
  if (content) {
    return Promise.all(
      [content].map(item =>
        client.groupOpenMessages(event.GuildId, {
          content: item,
          msg_id: event.MessageId,
          msg_type: 0,
          msg_seq: client.getMessageSeq(event.MessageId)
        })
      )
    )
  }
  const images = val.filter(
    item => item.type == 'Image' || item.type == 'ImageFile' || item.type == 'ImageURL'
  )
  if (images) {
    return Promise.all(
      images.map(async item => {
        if (item.type == 'ImageURL') {
          return client.groupOpenMessages(event.GuildId, {
            content: '',
            media: {
              file_info: item.value
            },
            msg_id: event.MessageId,
            msg_type: 7,
            msg_seq: client.getMessageSeq(event.MessageId)
          })
        }
        const file_data =
          item.type == 'ImageFile'
            ? readFileSync(item.value, 'base64')
            : item.value.toString('base64')
        const file_info = await client
          .postRichMediaByGroup(event.GuildId, {
            file_type: 1,
            file_data: file_data
          })
          .then(res => res?.file_info)
        if (!file_info) return Promise.resolve(null)
        return client.groupOpenMessages(event.GuildId, {
          content: '',
          media: {
            file_info
          },
          msg_id: event.MessageId,
          msg_type: 7,
          msg_seq: client.getMessageSeq(event.MessageId)
        })
      })
    )
  }
  return []
}

export const C2C_MESSAGE_CREATE = (client: Client, event, val: DataEnums[]) => {
  const content = val
    .filter(item => item.type == 'Link' || item.type == 'Mention' || item.type == 'Text')
    .map(item => {
      if (item.type == 'Text') {
        return item.value
      }
      return ''
    })
    .join('')
  if (content) {
    return Promise.all(
      [content].map(item =>
        client.usersOpenMessages(event.OpenId, {
          content: item,
          msg_id: event.MessageId,
          msg_type: 0,
          msg_seq: client.getMessageSeq(event.MessageId)
        })
      )
    )
  }
  const images = val.filter(
    item => item.type == 'Image' || item.type == 'ImageFile' || item.type == 'ImageURL'
  )
  if (images) {
    return Promise.all(
      images.map(async item => {
        if (item.type == 'ImageURL') {
          return client.usersOpenMessages(event.OpenId, {
            content: '',
            media: {
              file_info: item.value
            },
            msg_id: event.MessageId,
            msg_type: 7,
            msg_seq: client.getMessageSeq(event.MessageId)
          })
        }
        const file_data =
          item.type == 'ImageFile'
            ? readFileSync(item.value, 'base64')
            : item.value.toString('base64')
        const file_info = await client
          .postRichMediaByUsers(event.OpenId, {
            file_type: 1,
            file_data: file_data
          })
          .then(res => res?.file_info)
        if (!file_info) return Promise.resolve(null)
        return client.usersOpenMessages(event.OpenId, {
          content: '',
          media: {
            file_info
          },
          msg_id: event.MessageId,
          msg_type: 7,
          msg_seq: client.getMessageSeq(event.MessageId)
        })
      })
    )
  }
  return []
}

/**
 * 频道私聊
 * @param client
 * @param event
 * @param val
 * @returns
 */
export const DIRECT_MESSAGE_CREATE = (client: Client, event, val: DataEnums[]) => {
  const content = val
    .filter(item => item.type == 'Link' || item.type == 'Mention' || item.type == 'Text')
    .map(item => {
      if (item.type == 'Text') {
        return item.value
      }
      return ''
    })
    .join('')
  if (content) {
    return Promise.all(
      [content].map(item =>
        client.dmsMessage(event.OpenId, {
          content: item,
          msg_id: event.MessageId
        })
      )
    )
  }
  const images = val.filter(
    item => item.type == 'Image' || item.type == 'ImageFile' || item.type == 'ImageURL'
  )
  if (images) {
    return Promise.all(
      images.map(async item => {
        if (item.value == 'ImageURL') {
          // 请求得到buffer
          const data = await axios
            .get(item.value, {
              responseType: 'arraybuffer'
            })
            .then(res => res.data)
          return client.postDirectImage(event.OpenId, {
            msg_id: event.MessageId,
            image: data
          })
        }
        const file_data = item.type == 'ImageFile' ? readFileSync(item.value) : item.value
        return client.postDirectImage(event.OpenId, {
          msg_id: event.MessageId,
          image: Buffer.isBuffer(file_data) ? file_data : Buffer.from(file_data)
        })
      })
    )
  }
  return []
}

export const AT_MESSAGE_CREATE = (client: Client, event, val: DataEnums[]) => {
  const content = val
    .filter(item => item.type == 'Link' || item.type == 'Mention' || item.type == 'Text')
    .map(item => {
      if (item.type == 'Link') {
        return `[${item.options?.title ?? item.value}](${item.value})`
      } else if (item.type == 'Mention') {
        if (
          item.value == 'everyone' ||
          item.value == 'all' ||
          item.value == '' ||
          typeof item.value != 'string'
        ) {
          return `@everyone`
        }
        if (item.options?.belong == 'user') {
          return `<@!${item.value}>`
        } else if (item.options?.belong == 'channel') {
          return `<#${item.value}>`
        }
        return ''
      } else if (item.type == 'Text') {
        return item.value
      }
    })
    .join('')
  if (content) {
    return Promise.all(
      [content].map(item =>
        client.channelsMessagesPost(event.ChannelId, {
          content: item,
          msg_id: event.MessageId
        })
      )
    )
  }
  const images = val.filter(
    item => item.type == 'Image' || item.type == 'ImageFile' || item.type == 'ImageURL'
  )
  if (images) {
    return Promise.all(
      images.map(async item => {
        if (item.value == 'ImageURL') {
          // 请求得到buffer
          const data = await axios
            .get(item.value, {
              responseType: 'arraybuffer'
            })
            .then(res => res.data)
          return client.postImage(event.ChannelId, {
            msg_id: event.MessageId,
            image: data
          })
        }
        const file_data = item.type == 'ImageFile' ? readFileSync(item.value) : item.value
        return client.postImage(event.ChannelId, {
          msg_id: event.MessageId,
          image: Buffer.isBuffer(file_data) ? file_data : Buffer.from(file_data)
        })
      })
    )
  }
  return []
}

/**
 *
 * @param event
 * @param val
 * @returns
 */
export const MESSAGE_CREATE = (client: Client, event, val: DataEnums[]) => {
  const content = val
    .filter(item => item.type == 'Link' || item.type == 'Mention' || item.type == 'Text')
    .map(item => {
      if (item.type == 'Link') {
        return `[${item.options?.title ?? item.value}](${item.value})`
      } else if (item.type == 'Mention') {
        if (
          item.value == 'everyone' ||
          item.value == 'all' ||
          item.value == '' ||
          typeof item.value != 'string'
        ) {
          return `@everyone`
        }
        if (item.options?.belong == 'user') {
          return `<@!${item.value}>`
        } else if (item.options?.belong == 'channel') {
          return `<#${item.value}>`
        }
        return ''
      } else if (item.type == 'Text') {
        return item.value
      }
    })
    .join('')
  if (content) {
    return Promise.all(
      [content].map(item =>
        client.channelsMessagesPost(event.ChannelId, {
          content: item,
          msg_id: event.MessageId
        })
      )
    )
  }
  const images = val.filter(
    item => item.type == 'Image' || item.type == 'ImageFile' || item.type == 'ImageURL'
  )
  if (images) {
    return Promise.all(
      images.map(async item => {
        if (item.value == 'ImageURL') {
          // 请求得到buffer
          const data = await axios
            .get(item.value, {
              responseType: 'arraybuffer'
            })
            .then(res => res.data)
          return client.postImage(event.ChannelId, {
            msg_id: event.MessageId,
            image: data
          })
        }
        const file_data = item.type == 'ImageFile' ? readFileSync(item.value) : item.value
        return client.postImage(event.ChannelId, {
          msg_id: event.MessageId,
          image: Buffer.isBuffer(file_data) ? file_data : Buffer.from(file_data)
        })
      })
    )
  }
  return []
}
