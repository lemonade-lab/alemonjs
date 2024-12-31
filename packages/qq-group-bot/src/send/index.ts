import { QQBotGroupClient } from '../sdk/index'

type Client = typeof QQBotGroupClient.prototype

export const GROUP_AT_MESSAGE_CREATE = (client: Client, event, val) => {
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
  const images = val.filter(item => item.type == 'Image').map(item => item.value)
  if (images) {
    return Promise.all(
      images.map(async msg => {
        const file_info = await client
          .postRichMediaByGroup(event.GuildId, {
            file_type: 1,
            file_data: msg.toString('base64')
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

export const C2C_MESSAGE_CREATE = (client: Client, event, val) => {
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
  const images = val.filter(item => item.type == 'Image').map(item => item.value)
  if (images) {
    return Promise.all(
      images.map(async msg => {
        const file_info = await client
          .postRichMediaByUsers(event.OpenId, {
            file_type: 1,
            file_data: msg.toString('base64')
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
