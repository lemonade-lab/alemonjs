import { readFileSync } from 'fs'
import { QQBotAPI } from './sdk/api'
import {
  ButtonRow,
  ClientAPIMessageResult,
  createResult,
  DataArkBigCard,
  DataArkCard,
  DataArkList,
  ResultCode,
  type DataEnums
} from 'alemonjs'
import axios from 'axios'

type Client = typeof QQBotAPI.prototype

const createButtonsData = (rows: ButtonRow[]) => {
  let id = 0
  const data = {
    rows: rows.map(row => {
      const val = row.value
      return {
        buttons: val.map(button => {
          const value = button.value
          const options = button.options
          id++
          return {
            id: String(id),
            render_data: {
              label: typeof value == 'object' ? value.title : value,
              visited_label: typeof value == 'object' ? value.label : value,
              style: 0
            },
            action: {
              // 0 link 1 callback , 2 command
              type: typeof options.data === 'object' ? 1 : options?.isLink ? 0 : 2,
              permission: {
                // 所有人
                type: 2
                // "specify_role_ids": ["1", "2", "3"]
              },
              // "click_limit": 10,
              unsupport_tips: options?.toolTip ?? '',
              data: options?.data ?? '',
              // reply: true,
              at_bot_show_channel_list: options.showList ?? false,
              enter: options?.autoEnter ?? false
            }
          }
        })
      }
    })
  }
  return data
}

const createArkCardData = (value: DataArkCard['value']) => {
  return {
    template_id: 24,
    kv: [
      {
        key: '#DESC#',
        value: value.decs
      },
      {
        key: '#PROMPT#',
        value: value.prompt
      },
      {
        key: '#TITLE#',
        value: value.title
      },
      {
        key: '#METADESC#',
        value: value.metadecs
      },
      {
        key: '#IMG#',
        value: value.cover
      },
      {
        key: '#LINK#',
        value: value.link
      },
      {
        key: '#SUBTITLE#',
        value: value.subtitle
      }
    ]
  }
}

const createArkBigCardData = (value: DataArkBigCard['value']) => {
  return {
    template_id: 37,
    kv: [
      {
        key: '#PROMPT#',
        value: value.prompt
      },
      {
        key: '#METATITLE#',
        value: value.title
      },
      {
        key: '#METASUBTITLE#',
        value: value.subtitle
      },
      {
        key: '#METACOVER#',
        value: value.cover
      },
      {
        key: '#METAURL#',
        value: value.link
      }
    ]
  }
}

const createArkList = (value: DataArkList['value']) => {
  const [tip, data] = value
  return {
    template_id: 23,
    kv: [
      {
        key: '#DESC#',
        value: tip.value.desc
      },
      {
        key: '#PROMPT#',
        value: tip.value.prompt
      },
      {
        key: '#LIST#',
        obj: data.value.map(item => {
          const value = item.value
          if (typeof value === 'string') {
            return {
              obj_kv: [
                {
                  key: 'desc',
                  value: value
                }
              ]
            }
          }
          return {
            obj_kv: [
              {
                key: 'desc',
                value: value.title
              },
              {
                key: 'link',
                value: value.link
              }
            ]
          }
        })
      }
    ]
  }
}

/**
 * 群组消息
 * @param client
 * @param event
 * @param val
 * @returns
 */
export const GROUP_AT_MESSAGE_CREATE = async (
  client: Client,
  event,
  val: DataEnums[]
): Promise<ClientAPIMessageResult[]> => {
  const content = val
    .filter(item => item.type == 'Mention' || item.type == 'Text' || item.type == 'Link')
    .map(item => {
      if (item.type == 'Link') {
        return `[${item.value}](${item?.options?.link})`
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
    const res = await Promise.all(
      [content].map(async item => {
        const res = await client.groupOpenMessages(event.GuildId, {
          content: item,
          msg_id: event.MessageId,
          msg_type: 0,
          msg_seq: client.getMessageSeq(event.MessageId)
        })
        return createResult(ResultCode.Ok, 'client.groupOpenMessages', {
          id: res.id
        })
      })
    ).catch(err => [
      createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)
    ])
    return res
  }
  const images = val.filter(
    item => item.type == 'Image' || item.type == 'ImageFile' || item.type == 'ImageURL'
  )
  if (images && images.length > 0) {
    return Promise.all(
      images.map(async item => {
        if (item.type == 'ImageURL') {
          const res = await client.groupOpenMessages(event.GuildId, {
            content: '',
            media: {
              file_info: item.value
            },
            msg_id: event.MessageId,
            msg_type: 7,
            msg_seq: client.getMessageSeq(event.MessageId)
          })
          return createResult(ResultCode.Ok, 'client.groupOpenMessages', {
            id: res.id
          })
        }
        try {
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
          if (!file_info) {
            return createResult(ResultCode.Fail, 'client.postRichMediaByGroup', null)
          }
          const res = await client.groupOpenMessages(event.GuildId, {
            content: '',
            media: {
              file_info
            },
            msg_id: event.MessageId,
            msg_type: 7,
            msg_seq: client.getMessageSeq(event.MessageId)
          })
          return createResult(ResultCode.Ok, 'client.groupOpenMessages', {
            id: res.id
          })
        } catch (error) {
          return createResult(
            ResultCode.Fail,
            error ? error?.message ?? error : 'client.groupOpenMessages',
            null
          )
        }
      })
    ).catch(err => [
      createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)
    ])
  }
  // buttons
  const buttons = val.filter(item => item.type == 'BT.group')
  if (buttons && buttons.length > 0) {
    return Promise.all(
      buttons.map(async item => {
        const template_id = item?.options?.template_id
        if (template_id) {
          const res = await client.groupOpenMessages(event.GuildId, {
            content: '',
            msg_id: event.MessageId,
            keyboard: {
              id: template_id
            },
            msg_type: 2,
            msg_seq: client.getMessageSeq(event.MessageId)
          })
          return createResult(ResultCode.Ok, 'client.groupOpenMessages', {
            id: res.id
          })
        }
        const rows = item.value
        // 构造成按钮
        const data = createButtonsData(rows)
        const res = await client.groupOpenMessages(event.GuildId, {
          content: '',
          msg_id: event.MessageId,
          keyboard: {
            content: data
          },
          msg_type: 2,
          msg_seq: client.getMessageSeq(event.MessageId)
        })
        return createResult(ResultCode.Ok, 'client.groupOpenMessages', {
          id: res.id
        })
      })
    ).catch(err => [
      createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)
    ])
  }
  // ark
  const ark = val.filter(
    item => item.type == 'Ark.BigCard' || item.type == 'Ark.Card' || item.type == 'Ark.list'
  )
  if (ark && ark.length > 0) {
    return Promise.all(
      ark.map(async item => {
        if (item.type === 'Ark.Card') {
          const arkData = createArkCardData(item.value)
          const res = await client.groupOpenMessages(event.GuildId, {
            msg_id: event.MessageId,
            ark: arkData,
            msg_type: 3,
            msg_seq: client.getMessageSeq(event.MessageId)
          })
          return createResult(ResultCode.Ok, 'client.groupOpenMessages', {
            id: res.id
          })
        }
        if (item.type === 'Ark.BigCard') {
          const arkData = createArkBigCardData(item.value)
          const res = await client.groupOpenMessages(event.GuildId, {
            msg_id: event.MessageId,
            ark: arkData,
            msg_type: 3,
            msg_seq: client.getMessageSeq(event.MessageId)
          })
          return createResult(ResultCode.Ok, 'client.groupOpenMessages', { id: res.id })
        }
        const arkData = createArkList(item.value)
        const res = await client.groupOpenMessages(event.GuildId, {
          msg_id: event.MessageId,
          ark: arkData,
          msg_type: 3,
          msg_seq: client.getMessageSeq(event.MessageId)
        })
        return createResult(ResultCode.Ok, 'client.groupOpenMessages', { id: res.id })
      })
    ).catch(err => [
      createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)
    ])
  }
  return Promise.all([])
}

/**
 * 私聊消息
 * @param client
 * @param event
 * @param val
 * @returns
 */
export const C2C_MESSAGE_CREATE = (
  client: Client,
  event,
  val: DataEnums[]
): Promise<ClientAPIMessageResult[]> => {
  const content = val
    .filter(item => item.type == 'Mention' || item.type == 'Text' || item.type == 'Link')
    .map(item => {
      if (item.type == 'Link') {
        return `[${item.value}](${item?.options?.link})`
      } else if (item.type == 'Text') {
        return item.value
      }
      return ''
    })
    .join('')
  if (content) {
    return Promise.all(
      [content].map(async item => {
        const res = await client.usersOpenMessages(event.OpenId, {
          content: item,
          msg_id: event.MessageId,
          msg_type: 0,
          msg_seq: client.getMessageSeq(event.MessageId)
        })
        return createResult(ResultCode.Ok, 'client.usersOpenMessages', {
          id: res.id
        })
      })
    ).catch(err => [
      createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)
    ])
  }
  const images = val.filter(
    item => item.type == 'Image' || item.type == 'ImageFile' || item.type == 'ImageURL'
  )
  if (images && images.length > 0) {
    return Promise.all(
      images.map(async item => {
        if (item.type == 'ImageURL') {
          const res = await client.usersOpenMessages(event.OpenId, {
            content: '',
            media: {
              file_info: item.value
            },
            msg_id: event.MessageId,
            msg_type: 7,
            msg_seq: client.getMessageSeq(event.MessageId)
          })
          return createResult(ResultCode.Ok, 'client.usersOpenMessages', {
            id: res.id
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
    ).catch(err => [
      createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)
    ])
  }
  // buttons
  const buttons = val.filter(item => item.type == 'BT.group')
  if (buttons && buttons.length > 0) {
    return Promise.all(
      buttons.map(async item => {
        const template_id = item?.options?.template_id
        if (template_id) {
          const res = await client.usersOpenMessages(event.GuildId, {
            content: '',
            msg_id: event.MessageId,
            keyboard: {
              id: template_id
            },
            msg_type: 2,
            msg_seq: client.getMessageSeq(event.MessageId)
          })
          return createResult(ResultCode.Ok, 'client.usersOpenMessages', {
            id: res.id
          })
        }
        const rows = item.value
        // 构造成按钮
        const data = createButtonsData(rows)
        const res = await client.usersOpenMessages(event.GuildId, {
          content: '',
          msg_id: event.MessageId,
          keyboard: {
            content: data
          },
          msg_type: 2,
          msg_seq: client.getMessageSeq(event.MessageId)
        })
        return createResult(ResultCode.Ok, 'client.usersOpenMessages', {
          id: res.id
        })
      })
    ).catch(err => [
      createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)
    ])
  }
  // ark
  const ark = val.filter(
    item => item.type == 'Ark.BigCard' || item.type == 'Ark.Card' || item.type == 'Ark.list'
  )
  if (ark && ark.length > 0) {
    return Promise.all(
      ark.map(async item => {
        if (item.type === 'Ark.Card') {
          const arkData = createArkCardData(item.value)
          const res = await client.usersOpenMessages(event.GuildId, {
            msg_id: event.MessageId,
            ark: arkData,
            msg_type: 3,
            msg_seq: client.getMessageSeq(event.MessageId)
          })
          return createResult(ResultCode.Ok, 'client.usersOpenMessages', { id: res.id })
        }
        if (item.type === 'Ark.BigCard') {
          const arkData = createArkBigCardData(item.value)
          const res = await client.usersOpenMessages(event.GuildId, {
            msg_id: event.MessageId,
            ark: arkData,
            msg_type: 3,
            msg_seq: client.getMessageSeq(event.MessageId)
          })
          return createResult(ResultCode.Ok, 'client.usersOpenMessages', { id: res.id })
        }
        const arkData = createArkList(item.value)
        const res = await client.usersOpenMessages(event.GuildId, {
          msg_id: event.MessageId,
          ark: arkData,
          msg_type: 3,
          msg_seq: client.getMessageSeq(event.MessageId)
        })
        return createResult(ResultCode.Ok, 'client.usersOpenMessages', { id: res.id })
      })
    ).catch(err => [
      createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)
    ])
  }
  return Promise.all([])
}

/**
 * 频道私聊
 * @param client
 * @param event
 * @param val
 * @returns
 */
export const DIRECT_MESSAGE_CREATE = (
  client: Client,
  event,
  val: DataEnums[]
): Promise<ClientAPIMessageResult[]> => {
  const content = val
    .filter(item => item.type == 'Mention' || item.type == 'Text' || item.type == 'Link')
    .map(item => {
      if (item.type == 'Link') {
        return `[${item.value}](${item?.options?.link})`
      }
      if (item.type == 'Text') {
        return item.value
      }
      return ''
    })
    .join('')
  if (content) {
    return Promise.all(
      [content].map(async item => {
        const res = await client.dmsMessage(event.OpenId, {
          content: item,
          msg_id: event.MessageId
        })
        return createResult(ResultCode.Ok, 'client.dmsMessage', { id: res?.id })
      })
    ).catch(err => [
      createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)
    ])
  }
  const images = val.filter(
    item => item.type == 'Image' || item.type == 'ImageFile' || item.type == 'ImageURL'
  )
  if (images && images.length > 0) {
    return Promise.all(
      images.map(async item => {
        if (item.value == 'ImageURL') {
          // 请求得到buffer
          const data = await axios
            .get(item.value, {
              responseType: 'arraybuffer'
            })
            .then(res => res?.data)
          const res = await client.postDirectImage(event.OpenId, {
            msg_id: event.MessageId,
            image: data
          })
          return createResult(ResultCode.Ok, 'client.postDirectImage', { id: res?.id })
        }
        const file_data = item.type == 'ImageFile' ? readFileSync(item.value) : item.value
        const res = await client.postDirectImage(event.OpenId, {
          msg_id: event.MessageId,
          image: Buffer.isBuffer(file_data) ? file_data : Buffer.from(file_data)
        })
        return createResult(ResultCode.Ok, 'client.postDirectImage', { id: res?.id })
      })
    ).catch(err => [
      createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)
    ])
  }
  return Promise.all([])
}

export const AT_MESSAGE_CREATE = (
  client: Client,
  event,
  val: DataEnums[]
): Promise<ClientAPIMessageResult[]> => {
  const content = val
    .filter(item => item.type == 'Mention' || item.type == 'Text' || item.type == 'Link')
    .map(item => {
      if (item.type == 'Link') {
        return `[${item.value}](${item?.options?.link})`
      }
      if (item.type == 'Mention') {
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
      [content].map(async item => {
        const res = await client.channelsMessagesPost(event.ChannelId, {
          content: item,
          msg_id: event.MessageId
        })
        return createResult(ResultCode.Ok, 'client.channelsMessagesPost', { id: res?.id })
      })
    ).catch(err => [
      createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)
    ])
  }
  const images = val.filter(
    item => item.type == 'Image' || item.type == 'ImageFile' || item.type == 'ImageURL'
  )
  if (images && images.length > 0) {
    return Promise.all(
      images.map(async item => {
        if (item.value == 'ImageURL') {
          // 请求得到buffer
          const data = await axios
            .get(item.value, {
              responseType: 'arraybuffer'
            })
            .then(res => res.data)
          const res = await client.postImage(event.ChannelId, {
            msg_id: event.MessageId,
            image: data
          })
          return createResult(ResultCode.Ok, 'client.postImage', { id: res?.id })
        }
        const file_data = item.type == 'ImageFile' ? readFileSync(item.value) : item.value
        const res = await client.postImage(event.ChannelId, {
          msg_id: event.MessageId,
          image: Buffer.isBuffer(file_data) ? file_data : Buffer.from(file_data)
        })
        return createResult(ResultCode.Ok, 'client.postImage', { id: res?.id })
      })
    ).catch(err => [
      createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)
    ])
  }
  return Promise.all([])
}

/**
 *
 * @param event
 * @param val
 * @returns
 */
export const MESSAGE_CREATE = (
  client: Client,
  event,
  val: DataEnums[]
): Promise<ClientAPIMessageResult[]> => {
  const content = val
    .filter(item => item.type == 'Mention' || item.type == 'Text' || item.type == 'Link')
    .map(item => {
      if (item.type == 'Link') {
        return `[${item.value}](${item?.options?.link})`
      }
      if (item.type == 'Mention') {
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
      [content].map(async item => {
        const res = await client.channelsMessagesPost(event.ChannelId, {
          content: item,
          msg_id: event.MessageId
        })
        return createResult(ResultCode.Ok, 'client.channelsMessagesPost', { id: res?.id })
      })
    ).catch(err => [
      createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)
    ])
  }
  const images = val.filter(
    item => item.type == 'Image' || item.type == 'ImageFile' || item.type == 'ImageURL'
  )
  if (images && images.length > 0) {
    return Promise.all(
      images.map(async item => {
        if (item.value == 'ImageURL') {
          // 请求得到buffer
          const data = await axios
            .get(item.value, {
              responseType: 'arraybuffer'
            })
            .then(res => res.data)
          const res = await client.postImage(event.ChannelId, {
            msg_id: event.MessageId,
            image: data
          })
          return createResult(ResultCode.Ok, 'client.postImage', { id: res?.id })
        }
        const file_data = item.type == 'ImageFile' ? readFileSync(item.value) : item.value
        const res = await client.postImage(event.ChannelId, {
          msg_id: event.MessageId,
          image: Buffer.isBuffer(file_data) ? file_data : Buffer.from(file_data)
        })
        return createResult(ResultCode.Ok, 'client.postImage', { id: res?.id })
      })
    ).catch(err => [
      createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)
    ])
  }
  return Promise.all([])
}
