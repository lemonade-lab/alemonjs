import { ButtonRow, createResult, DataEnums, ResultCode } from 'alemonjs'
import { readFileSync } from 'fs'
import { DCClient } from './sdk/wss'

type Client = typeof DCClient.prototype

const ImageURLToBuffer = async (url: string) => {
  const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
  return Buffer.from(arrayBuffer)
}

const createButtonsData = (rows: ButtonRow[]) => {
  let id = 0
  return rows.map(row => {
    const val = row.value
    return {
      type: 1,
      components: val.map(button => {
        const value = button.value
        // const options = button.options
        id++
        return {
          type: 2,
          custom_id: String(id),
          style: 1,
          label: typeof value == 'object' ? value.title : value
          // action: {
          //     // 0 link 1 callback , 2 command
          //     type: typeof options.data === 'object' ? 1 : options?.isLink ? 0 : 2,
          //     data: options?.data ?? '',
          //     enter: options?.autoEnter ?? false
          // }
        }
      })
    }
  })
}

export const sendchannel = (client: Client, channel_id: string, val: DataEnums[]) => {
  if (val.length < 0) return Promise.all([])
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
  if (content) {
    return Promise.all(
      [content].map(item =>
        client.channelsMessages(channel_id, {
          content: item
        })
      )
    )
  }
  const images = val.filter(
    item => item.type == 'Image' || item.type == 'ImageURL' || item.type == 'ImageFile'
  )
  if (images.length > 0) {
    return Promise.all(
      images.map(async item => {
        if (item.type == 'Image') {
          return client.channelsMessagesImage(channel_id, item.value)
        } else if (item.type == 'ImageURL') {
          return client.channelsMessagesImage(channel_id, ImageURLToBuffer(item.value))
        } else if (item.type == 'ImageFile') {
          const data = readFileSync(item.value)
          return client.channelsMessagesImage(channel_id, data)
        }
      })
    )
  }
  // buttons
  const buttons = val.filter(item => item.type == 'BT.group')
  if (buttons && buttons.length > 0) {
    return Promise.all(
      buttons.map(async item => {
        const rows = item.value
        // 构造成按钮
        const data = createButtonsData(rows)
        const res = await client.channelsMessages(channel_id, {
          content: '',
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
  return Promise.all([])
}

export const senduser = async (client: Client, author_id: string, val: DataEnums[]) => {
  if (val.length < 0) return Promise.all([])
  const res = await client.userMeChannels(author_id)
  const channel_id = res.id
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
  if (content) {
    return Promise.all(
      [content].map(item =>
        client.channelsMessages(channel_id, {
          content: item
        })
      )
    )
  }
  const images = val.filter(
    item => item.type == 'Image' || item.type == 'ImageURL' || item.type == 'ImageFile'
  )
  if (images && images.length > 0) {
    return Promise.all(
      images.map(async item => {
        if (item.type == 'Image') {
          return client.channelsMessagesImage(channel_id, item.value)
        } else if (item.type == 'ImageURL') {
          return client.channelsMessagesImage(channel_id, ImageURLToBuffer(item.value))
        } else if (item.type == 'ImageFile') {
          const data = readFileSync(item.value)
          return client.channelsMessagesImage(channel_id, data)
        }
      })
    )
  }
  // buttons
  const buttons = val.filter(item => item.type == 'BT.group')
  if (buttons && buttons.length > 0) {
    return Promise.all(
      buttons.map(async item => {
        const rows = item.value
        // 构造成按钮
        const data = createButtonsData(rows)
        const res = await client.channelsMessages(channel_id, {
          content: '',
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
  return Promise.all([])
}
