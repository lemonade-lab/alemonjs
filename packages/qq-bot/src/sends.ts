import { readFileSync } from 'fs'
import { QQBotAPI } from './sdk/api'
import {
  ButtonRow,
  ClientAPIMessageResult,
  createResult,
  DataArkBigCard,
  DataArkCard,
  DataArkList,
  DataMarkDown,
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

// 数据md转为文本
const createMarkdownText = (data: DataMarkDown['value']) => {
  const content = data
    .map(mdItem => {
      if (mdItem.type === 'MD.title') {
        // \n
        return `# ${mdItem.value}\n`
      } else if (mdItem.type === 'MD.subtitle') {
        // \n
        return `## ${mdItem.value}\n`
      } else if (mdItem.type === 'MD.text') {
        // 正文
        return `${mdItem.value} `
      } else if (mdItem.type === 'MD.bold') {
        // 加粗
        return `**${mdItem.value}** `
      } else if (mdItem.type === 'MD.divider') {
        // 分割线
        return '\n————————\n'
      } else if (mdItem.type === 'MD.italic') {
        // 斜体
        return `_${mdItem.value}_ `
      } else if (mdItem.type === 'MD.italicStar') {
        // 星号斜体
        return `*${mdItem.value}* `
      } else if (mdItem.type === 'MD.strikethrough') {
        // 删除线
        return `~~${mdItem.value}~~ `
      } else if (mdItem.type === 'MD.blockquote') {
        // \n
        return `> ${mdItem.value}\n`
      } else if (mdItem.type === 'MD.newline') {
        // 换行
        return '\n'
      } else if (mdItem.type === 'MD.link') {
        //
        return `[🔗${mdItem.value.text}](${mdItem.value.url}) `
      } else if (mdItem.type === 'MD.image') {
        //
        return `![text #${mdItem.options?.width || 208}px #${mdItem.options?.height || 320}px](${
          mdItem.value
        }) `
      } else if (mdItem.type === 'MD.list') {
        const listStr = mdItem.value.map(listItem => {
          // 有序
          if (typeof listItem.value === 'object') {
            return `\n${listItem.value.index}. ${listItem.value.text}`
          }
          // 无序
          return `\n- ${listItem.value}`
        })
        return `${listStr}\n`
      }
      return
    })
    .join('')
  return content
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
  try {
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
      const res = await client.groupOpenMessages(event.GuildId, {
        content: content,
        msg_id: event.MessageId,
        msg_type: 0,
        msg_seq: client.getMessageSeq(event.MessageId)
      })
      return [
        createResult(ResultCode.Ok, 'client.groupOpenMessages', {
          id: res.id
        })
      ]
    }
    const images = val.filter(
      item => item.type == 'Image' || item.type == 'ImageFile' || item.type == 'ImageURL'
    )
    if (images && images.length > 0) {
      let url = ''
      images.filter(async item => {
        // 已经处理。
        if (url) return
        if (item.type == 'ImageURL') {
          url = item.value
        } else if (item.type === 'ImageFile' || item.type === 'Image') {
          const getFileBase64 = (): string => readFileSync(item.value, 'base64')
          const file_data = item.type == 'ImageFile' ? getFileBase64() : item.value
          const file_info = await client
            .postRichMediaByGroup(event.GuildId, {
              file_type: 1,
              file_data: file_data
            })
            .then(res => res?.file_info)
          if (file_info) {
            url = file_info
          }
        }
      })
      const res = await client.groupOpenMessages(event.GuildId, {
        content: '',
        media: {
          file_info: url
        },
        msg_id: event.MessageId,
        msg_type: 7,
        msg_seq: client.getMessageSeq(event.MessageId)
      })
      return [
        createResult(ResultCode.Ok, 'client.groupOpenMessages', {
          id: res.id
        })
      ]
    }
    const mdAndButtons = val.filter(item => item.type == 'Markdown' || item.type == 'BT.group')
    if (mdAndButtons && mdAndButtons.length > 0) {
      const params = {}
      mdAndButtons.forEach(async item => {
        if (item.type === 'BT.group') {
          // 如果是按钮，获取参数
          const template_id = item?.options?.template_id
          if (template_id) {
            params['keyboard'] = {
              id: template_id
            }
          } else {
            const rows = item.value
            // 构造成按钮
            const content = createButtonsData(rows)
            params['keyboard'] = {
              content: content
            }
          }
        } else if (item.type === 'Markdown') {
          // 如果是markdown，获取内容
          const content = createMarkdownText(item.value)
          if (content) {
            params['markdown'] = {
              content: content
            }
          }
        }
      })
      const res = await client.groupOpenMessages(event.GuildId, {
        content: '',
        markdown: {
          content: content
        },
        msg_id: event.MessageId,
        msg_type: 2,
        msg_seq: client.getMessageSeq(event.MessageId),
        ...params
      })
      return [createResult(ResultCode.Ok, 'client.groupOpenMessages', { id: res.id })]
    }
    // ark
    const ark = val.filter(
      item => item.type == 'Ark.BigCard' || item.type == 'Ark.Card' || item.type == 'Ark.list'
    )
    if (ark && ark.length > 0) {
      const params = {}
      ark.forEach(async item => {
        if (item.type === 'Ark.Card') {
          const arkData = createArkCardData(item.value)
          params['ark'] = arkData
        } else if (item.type === 'Ark.BigCard') {
          const arkData = createArkBigCardData(item.value)
          params['ark'] = arkData
        } else if (item.type === 'Ark.list') {
          const arkData = createArkList(item.value)
          params['ark'] = arkData
        }
      })
      const res = await client.groupOpenMessages(event.GuildId, {
        msg_id: event.MessageId,
        msg_type: 3,
        msg_seq: client.getMessageSeq(event.MessageId),
        ...params
      })
      return [createResult(ResultCode.Ok, 'client.groupOpenMessages', { id: res.id })]
    }
  } catch (err) {
    return [createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)]
  }
  return []
}

/**
 * 私聊消息
 * @param client
 * @param event
 * @param val
 * @returns
 */
export const C2C_MESSAGE_CREATE = async (
  client: Client,
  event,
  val: DataEnums[]
): Promise<ClientAPIMessageResult[]> => {
  try {
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
      const res = await client.usersOpenMessages(event.OpenId, {
        content: content,
        msg_id: event.MessageId,
        msg_type: 0,
        msg_seq: client.getMessageSeq(event.MessageId)
      })
      return [
        createResult(ResultCode.Ok, 'client.usersOpenMessages', {
          id: res.id
        })
      ]
    }
    const images = val.filter(
      item => item.type == 'Image' || item.type == 'ImageFile' || item.type == 'ImageURL'
    )
    if (images && images.length > 0) {
      let url = ''
      images.filter(async item => {
        // 已经处理。
        if (url) return
        if (item.type == 'ImageURL') {
          url = item.value
        } else if (item.type === 'ImageFile' || item.type === 'Image') {
          const getFileBase64 = (): string => readFileSync(item.value, 'base64')
          const file_data = item.type == 'ImageFile' ? getFileBase64() : item.value
          const file_info = await client
            .postRichMediaByGroup(event.GuildId, {
              file_type: 1,
              file_data: file_data
            })
            .then(res => res?.file_info)
          if (file_info) {
            url = file_info
          }
        }
      })
      const res = await client.usersOpenMessages(event.OpenId, {
        content: '',
        media: {
          file_info: url
        },
        msg_id: event.MessageId,
        msg_type: 7,
        msg_seq: client.getMessageSeq(event.MessageId)
      })
      return [
        createResult(ResultCode.Ok, 'client.usersOpenMessages', {
          id: res.id
        })
      ]
    }
    const mdAndButtons = val.filter(item => item.type == 'Markdown' || item.type == 'BT.group')
    if (mdAndButtons && mdAndButtons.length > 0) {
      const params = {}
      mdAndButtons.forEach(async item => {
        if (item.type === 'BT.group') {
          // 如果是按钮，获取参数
          const template_id = item?.options?.template_id
          if (template_id) {
            params['keyboard'] = {
              id: template_id
            }
          } else {
            const rows = item.value
            // 构造成按钮
            const content = createButtonsData(rows)
            params['keyboard'] = {
              content: content
            }
          }
        } else if (item.type === 'Markdown') {
          // 如果是markdown，获取内容
          const content = createMarkdownText(item.value)
          if (content) {
            params['markdown'] = {
              content: content
            }
          }
        }
      })
      const res = await client.usersOpenMessages(event.OpenId, {
        content: '',
        msg_id: event.MessageId,
        msg_type: 2,
        msg_seq: client.getMessageSeq(event.MessageId),
        ...params
      })
      return [createResult(ResultCode.Ok, 'client.usersOpenMessages', { id: res.id })]
    }
    // ark
    const ark = val.filter(
      item => item.type == 'Ark.BigCard' || item.type == 'Ark.Card' || item.type == 'Ark.list'
    )
    if (ark && ark.length > 0) {
      const params = {}
      ark.forEach(async item => {
        if (item.type === 'Ark.Card') {
          const arkData = createArkCardData(item.value)
          params['ark'] = arkData
        } else if (item.type === 'Ark.BigCard') {
          const arkData = createArkBigCardData(item.value)
          params['ark'] = arkData
        } else if (item.type === 'Ark.list') {
          const arkData = createArkList(item.value)
          params['ark'] = arkData
        }
      })
      const res = await client.usersOpenMessages(event.OpenId, {
        msg_id: event.MessageId,
        msg_type: 3,
        msg_seq: client.getMessageSeq(event.MessageId),
        ...params
      })
      return [createResult(ResultCode.Ok, 'client.usersOpenMessages', { id: res.id })]
    }
  } catch (err) {
    return [createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)]
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
        const file_data =
          item.type == 'ImageFile' ? readFileSync(item.value) : Buffer.from(item.value, 'base64')
        const res = await client.postDirectImage(event.OpenId, {
          msg_id: event.MessageId,
          image: file_data
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
        const file_data =
          item.type == 'ImageFile' ? readFileSync(item.value) : Buffer.from(item.value, 'base64')
        const res = await client.postImage(event.ChannelId, {
          msg_id: event.MessageId,
          image: file_data
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
        const file_data =
          item.type == 'ImageFile' ? readFileSync(item.value) : Buffer.from(item.value, 'base64')
        const res = await client.postImage(event.ChannelId, {
          msg_id: event.MessageId,
          image: file_data
        })
        return createResult(ResultCode.Ok, 'client.postImage', { id: res?.id })
      })
    ).catch(err => [
      createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)
    ])
  }
  return Promise.all([])
}
