import { defineBot, getConfig, OnProcessor, Text, useParse } from 'alemonjs'
import TelegramClient from 'node-telegram-bot-api'

export type Client = typeof TelegramClient.prototype
export const client: Client = global.client

export default defineBot(() => {
  //
  const cfg = getConfig()
  const config = cfg.value?.['telegram']
  if (!config) return
  //
  const client = new TelegramClient(config.token, {
    polling: true,
    baseApiUrl: config?.base_api_url ?? '',
    request: {
      url: config?.request_url ?? '',
      proxy: config?.proxy ?? ''
    }
  })

  const getUserProfilePhotosUrl = (UserId: number) => {
    return new Promise((resolve, reject) => {
      if (!UserId) {
        reject(new Error('UserId 不能为空'))
        return
      }
      client
        .getUserProfilePhotos(UserId)
        .then(profilePhotos => {
          if (profilePhotos.total_count > 0) {
            // 获取第一张头像的文件 ID
            const fileId = profilePhotos.photos[0][0].file_id
            // 获取文件信息以获取下载链接
            client
              .getFile(fileId)
              .then(file => {
                const filePath = file.file_path
                resolve(`https://api.telegram.org/file/bot${config.token}/${filePath}`)
              })
              .catch(reject)
          } else {
            reject(new Error('用户没有头像'))
          }
        })
        .catch(reject)
    })
  }

  //
  client.on('text', async event => {
    let UserAvatar = ''

    if (event?.chat.type == 'supergroup' || event?.chat.type == 'private') {
      const photo = await getUserProfilePhotosUrl(event?.from?.id).catch(console.error)
      if (typeof photo == 'string') UserAvatar = photo
    }

    if (event?.chat.type == 'channel' || event?.chat.type == 'supergroup') {
      // 机器人消息不处理
      if (event?.from?.is_bot) return
      // 定义消
      const e = {
        // 事件类型
        Platform: 'telegram',
        // 频道
        GuildId: String(event?.chat.id),
        // 频道名称
        GuildName: event?.chat.title,
        // 子频道
        ChannelId: String(event?.chat.id),
        GuildIdAvatar: '',
        GuildIdName: '',
        // 是否是主人
        IsMaster: false,
        // 用户ID
        UserId: String(event?.from?.id),
        // 用户名
        UserName: event?.chat.username,
        // 用户头像
        UserAvatar: UserAvatar,
        // 格式化数据
        MsgId: String(event?.message_id),
        // 用户消息
        MessageBody: [Text(event?.text)],
        // 用户openId
        OpenID: String(event?.chat?.id),
        // 创建时间
        CreateAt: Date.now(),
        //
        tag: 'txt',
        //
        value: null
      }
      // 当访问的时候获取
      Object.defineProperty(e, 'value', {
        get() {
          return event
        }
      })
      //
      OnProcessor(e as any, 'message.create')
      //
    } else if (event?.chat.type == 'private') {
      // 定义消
      const e = {
        // 事件类型
        Platform: 'telegram',
        // 是否是主人
        IsMaster: false,
        // 用户ID
        UserId: String(event?.from.id),
        // 用户名
        UserName: event?.from?.username,
        GuildIdName: '',
        GuildIdAvatar: '',
        ChannelName: '',
        // 用户头像
        UserAvatar: UserAvatar,
        // 格式化数据
        MsgId: String(event?.message_id),
        // 用户消息
        MessageBody: [Text(event?.text)],
        MessageText: event?.text,
        // 用户openId
        OpenID: String(event?.chat?.id),
        // 创建时间
        CreateAt: Date.now(),
        //
        tag: 'txt',
        //
        value: null
      }
      // 当访问的时候获取
      Object.defineProperty(e, 'value', {
        get() {
          return event
        }
      })
      // 处理消息
      OnProcessor(e, 'private.message.create')
    }
  })

  client.on('new_chat_members', async event => {
    // 机器人消息不处理
    if (event?.from.is_bot) return

    let UserAvatar = ''

    const photo = await getUserProfilePhotosUrl(event?.from?.id).catch(console.error)
    if (typeof photo == 'string') UserAvatar = photo

    // 定义消
    const e = {
      // 事件类型
      Platform: 'telegram',
      // 频道
      GuildId: String(event?.chat.id),
      // 频道名称
      GuildName: event?.chat.title,
      // 子频道
      ChannelId: String(event?.chat.id),
      GuildIdAvatar: '',
      GuildIdName: '',
      // 是否是主人
      IsMaster: false,
      // 用户ID
      UserId: String(event?.from?.id),
      // 用户名
      UserName: event?.chat.username,
      // 用户头像
      UserAvatar: UserAvatar,
      // 格式化数据
      MsgId: String(event?.message_id),
      // 用户消息
      MessageBody: [Text(event?.text)],
      //
      MessageText: event?.text,
      // 用户openId
      OpenID: String(event?.chat?.id),
      // 创建时间
      CreateAt: Date.now(),
      //
      tag: 'txt',
      //
      value: null
    }
    // 当访问的时候获取
    Object.defineProperty(e, 'value', {
      get() {
        return event
      }
    })
    //
    OnProcessor(e as any, 'member.add')
  })

  // const eventKeys = [
  //   'message',
  //   'text',
  //   'animation',
  //   'audio',
  //   'channel_chat_created',
  //   'contact',
  //   'delete_chat_photo',
  //   'document',
  //   'game',
  //   'group_chat_created',
  //   'invoice',
  //   'left_chat_member',
  //   'location',
  //   'migrate_from_chat_id',
  //   'migrate_to_chat_id',
  //   'new_chat_members',
  //   'new_chat_photo',
  //   'new_chat_title',
  //   'passport_data',
  //   'photo',
  //   'pinned_message',
  //   'sticker',
  //   'successful_payment',
  //   'supergroup_chat_created',
  //   'video',
  //   'video_note',
  //   'voice',
  //   'video_chat_started',
  //   'video_chat_ended',
  //   'video_chat_participants_invited',
  //   'video_chat_scheduled',
  //   'message_auto_delete_timer_changed',
  //   'chat_invite_link',
  //   'chat_member_updated',
  //   'web_app_data',
  //   'callback_query',
  //   'inline_query',
  //   'poll',
  //   'poll_answer',
  //   'chat_member',
  //   'my_chat_member',
  //   'chosen_inline_result',
  //   // hannel
  //   'channel_post',
  //   // edited
  //   'edited_message',
  //   'edited_message_text',
  //   'edited_message_caption',
  //   // 频道消息修改
  //   'edited_channel_post',
  //   // 频道消息修改
  //   'edited_channel_post_text',
  //   // 频道消息修改
  //   'edited_channel_post_caption',
  //   'shipping_query',
  //   'pre_checkout_query',
  //   'polling_error',
  //   'webhook_error',
  //   'chat_join_request'
  // ]
  // // 打印全部的消息
  // for (const key of eventKeys) {
  //   client.on(key, event => {
  //     console.log(key, event)
  //   })
  // }

  global.client = client

  return {
    api: {
      use: {
        send: (event, val: any[]) => {
          if (val.length < 0) return Promise.all([])
          if (val.length < 0) return Promise.all([])
          const content = useParse(
            {
              MessageBody: val
            },
            'Text'
          )
          const e = event?.value
          if (content) {
            return Promise.all([content].map(item => client.sendMessage(e.chat.id, item)))
          }
          const images = useParse(
            {
              MessageBody: val
            },
            'Image'
          )
          if (images) {
            return Promise.all(images.map(item => client.sendPhoto(e.chat.id, item)))
          }
          return Promise.all([])
        }
      }
    }
  }
})
