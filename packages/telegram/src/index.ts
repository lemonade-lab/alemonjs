import { defineBot, getConfig, OnProcessor, Text, useParse } from 'alemonjs'
import Client from 'node-telegram-bot-api'
export default defineBot(() => {
  const cfg = getConfig()
  const config = cfg.value?.['telegram']
  if (!config) return
  //
  const client = new Client(config.token, {
    polling: true,
    baseApiUrl: '',
    request: {
      url: '',
      proxy: config?.proxy ?? 'http://127.0.0.1:7890'
    }
  })
  //
  //
  client.on('message', event => {
    // 定义消
    const e = {
      // 事件类型
      Platform: 'telegram',
      // 频道
      GuildId: String(event.chat.id),
      // 子频道
      ChannelId: String(event.chat.id),
      // 是否是主人
      IsMaster: false,
      // 用户ID
      UserId: String(event?.sender_chat?.id),
      // 用户名
      UserName: event.sender_chat.username,
      // 用户头像
      UserAvatar: '',
      // 格式化数据
      MsgId: String(event.message_id),
      // 用户消息
      Megs: [Text(event.text ?? '')],
      // 用户openId
      OpenID: 'test',
      // 创建时间
      CreateAt: Date.now(),
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
  })

  // const eventKeys: string[] = [
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

  // 打印全部的消息
  // for (const key of eventKeys) {
  //   client.on(key, event => {
  //     console.log(key, event)
  //   })
  // }

  //
  return {
    api: {
      use: {
        send: (event, val: any[]) => {
          if (val.length < 0) return Promise.all([])
          if (val.length < 0) return Promise.all([])
          const content = useParse(val, 'Text')
          if (content) {
            return Promise.all([content].map(item => client.sendMessage(event.GuildId, item)))
          }
          const images = useParse(val, 'Image')
          if (images) {
            return Promise.all(images.map(item => client.sendPhoto(event.GuildId, item)))
          }
          return Promise.all([])
        }
      }
    }
  }
})
