import { ButtonRow, createResult, DataEnums, ResultCode } from 'alemonjs'
import { readFileSync } from 'fs'
import { DCClient } from './sdk/wss'

type Client = typeof DCClient.prototype

const ImageURLToBuffer = async (url: string) => {
  const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
  return Buffer.from(arrayBuffer)
}

const createButtonsData = (rows: ButtonRow[]) => {
  return rows.map(row => {
    const val = row.value
    return {
      type: 1,
      components: val.map(button => {
        const value = button.value
        let text = ''
        if (typeof button.options?.data === 'object') {
          text = button.options?.data.click
        } else {
          text = button.options.data
        }
        return {
          type: 2,
          custom_id: text,
          style: 1,
          label: typeof value == 'object' ? value.title : value
        }
      })
    }
  })
}

export const sendchannel = (
  client: Client,
  param: {
    channel_id: string
  },
  val: DataEnums[]
) => {
  if (val.length < 0) return Promise.all([])
  const channel_id = param?.channel_id ?? ''
  // images
  const images = val.filter(
    item => item.type == 'Image' || item.type == 'ImageURL' || item.type == 'ImageFile'
  )
  // buttons
  const buttons = val.filter(item => item.type == 'BT.group')
  // text
  const content = val
    .filter(item => item.type == 'Mention' || item.type == 'Text' || item.type == 'Link')
    .map(item => {
      if (item.type == 'Link') {
        return `[${item.value}](${item?.options?.link ?? item.value})`
      } else if (item.type == 'Mention') {
        if (
          item.value == 'everyone' ||
          item.value == 'all' ||
          item.value == '' ||
          typeof item.value != 'string'
        ) {
          return `<@everyone>`
        }
        if (item.options?.belong == 'user') {
          return `<@${item.value}>`
        } else if (item.options?.belong == 'channel') {
          return `<#${item.value}>`
        }
        return ''
      } else if (item.type == 'Text') {
        if (item.options?.style == 'block') {
          return `\`${item.value}\``
        } else if (item.options?.style == 'italic') {
          return `*${item.value}*`
        } else if (item.options?.style == 'bold') {
          return `**${item.value}**`
        } else if (item.options?.style == 'strikethrough') {
          return `~~${item.value}~~`
        }
        return item.value
      }
    })
    .join('')
  if (images.length > 0) {
    let isText = false
    return Promise.all(
      images.map(async item => {
        // content
        let text = null
        if (!isText) {
          text = content
        }
        isText = true
        if (item.type == 'Image') {
          return client.channelsMessagesImage(channel_id, Buffer.from(item.value, 'base64'), {
            content: text
          })
        } else if (item.type == 'ImageURL') {
          return client.channelsMessagesImage(channel_id, await ImageURLToBuffer(item.value), {
            content: text
          })
        } else if (item.type == 'ImageFile') {
          const data = readFileSync(item.value)
          return client.channelsMessagesImage(channel_id, data, { content: text })
        }
      })
    )
  }
  if (buttons && buttons.length > 0) {
    let isText = false
    return Promise.all(
      buttons.map(async item => {
        // content
        let text = ''
        if (!isText) {
          text = content
        }
        isText = true
        const rows = item.value
        // 构造成按钮
        const data = createButtonsData(rows)
        const res = await client.channelsMessages(channel_id, {
          content: content,
          components: data
        })
        return createResult(ResultCode.Ok, 'client.groupOpenMessages', {
          id: res.id
        })
      })
    ).catch(err => [
      createResult(ResultCode.Fail, err?.response?.data ?? err?.message ?? err, null)
    ])
  }
  if (content) {
    return Promise.all(
      [content].map(item =>
        client.channelsMessages(channel_id, {
          content: item
        })
      )
    )
  }
  return Promise.all([])
}

export const senduser = async (
  client: Client,
  param: {
    author_id?: string
    channel_id?: string
  },
  val: DataEnums[]
) => {
  if (val.length < 0) return Promise.all([])
  const channel_id = param?.channel_id ?? (await client.userMeChannels(param.author_id))?.id
  return sendchannel(client, { channel_id }, val)
}
