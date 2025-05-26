import { useUserHashKey, getConfigValue, User, cbpPlatform } from 'alemonjs'
import { Client as ICQQClient, PrivateMessageEvent, segment, Sendable } from 'icqq'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { device, error, qrcode, slider } from './login'
import { onDevice, onError, onQrcode, onSlider } from './login-web'
import {
  platform,
  onOnline,
  onOffline,
  onGroupMessage,
  onPrivateMessage,
  onSend,
  waitWeb
} from './listener'
import { activate } from './desktop'
/** tree-shaking */
console.debug(activate)

export { platform }

// 监听父进程
await waitWeb(2000)

export default async () => {
  let value = getConfigValue()
  if (!value) value = {}
  let config = value[platform]
  if (!config) config = {}
  const d = Number(config?.device)
  // 更改icqq目录
  const data_dir = join(process.cwd(), 'data', 'icqq')
  if (!existsSync(data_dir)) mkdirSync(data_dir, { recursive: true })

  // 创建客户端
  const client = new ICQQClient({
    // 机器人配置
    sign_api_addr: config?.sign_api_addr,
    // 默认要扫码登录
    platform: isNaN(d) ? 3 : d,
    // 默认版本
    ver: config?.ver,
    // 日志等级，默认info
    log_level: config?.log_level || 'info',
    // 群聊和频道中过滤自己的消息
    ignore_self: config?.ignore_self || true,
    // 被风控时是否尝试用分片发送
    resend: config?.resend || true,
    // 触发`system.offline.network`事件后的重新登录间隔秒数
    reconn_interval: config?.reconn_interval || 5,
    // 是否缓存群员列表
    cache_group_member: config?.cache_group_member || true,
    // ffmepg路径
    ffmpeg_path: config?.ffmpeg_path || '',
    ffprobe_path: config?.ffprobe_path || '',
    // icqq数据目录
    data_dir: data_dir
  })

  const url = `ws://127.0.0.1:${process.env?.port || config?.port || 17117}`
  const cbp = cbpPlatform(url)

  const qq = Number(config?.qq)
  // 连接
  client.login(qq, config.password)
  // 错误
  client.on('system.login.error', event => (global.qqDesktopStatus ? onError(event) : error(event)))
  // 设备
  client.on('system.login.device', event =>
    global.qqDesktopStatus ? onDevice(event) : device(client, event)
  )
  // 二维码
  client.on('system.login.qrcode', event =>
    global.qqDesktopStatus ? onQrcode(event) : qrcode(client)
  )
  // 滑块
  client.on('system.login.slider', event =>
    global.qqDesktopStatus ? onSlider(event) : slider(client, event, qq)
  )
  // token过期
  client.on(
    'system.token.expire',
    () =>
      global.qqDesktopStatus &&
      onError({ code: 1145, message: '登录token过期，请删除token重新登录~' })
  )
  // 内部错误
  client.on(
    'internal.verbose',
    event => global.qqDesktopStatus && onError({ code: 114514, message: event })
  )
  // client.on('internal.error.login', (event) => console.log('登录错误internal', event));
  // 登录
  client.on('system.online', onOnline)
  // 监听群消息
  client.on('message.group', onGroupMessage)
  // 监听消息
  client.on('message.private', onPrivateMessage)
  // 下线
  client.on('system.offline', onOffline)
  // 网络掉线
  client.on('system.offline.network', onOffline)
  // 服务器被踢
  client.on('system.offline.kickoff', onOffline)
  // 隐藏事件
  // client.on('internal.sso', onInternalSso)
  // 未知事件
  client.on('send', onSend)

  const api = {
    use: {
      send: async (event, val) => {
        if (val.length < 0) return []
        try {
          const content: Sendable = val
            .filter(item => item.type == 'Mention' || item.type == 'Text')
            .map(item => {
              if (item.type == 'Mention') {
                if (
                  item.value == 'everyone' ||
                  item.value == 'all' ||
                  item.value == '' ||
                  typeof item.value != 'string'
                ) {
                  return segment.at('all')
                }
                if (item.options?.belong == 'user') {
                  return segment.at(item.value)
                }
                return segment.text('')
              } else if (item.type == 'Text') {
                return segment.text(item.value)
              }
              return segment.text('')
            })
          if (content) {
            return await Promise.all([client.pickGroup(event.ChannelId).sendMsg(content)])
          }
          const images = val.filter(item => item.type == 'Image').map(item => item.value)
          if (images) {
            return await Promise.all([
              client.pickGroup(event.ChannelId).sendMsg(images.map(item => segment.image(item)))
            ])
          }
        } catch (e) {
          return [e]
        }
        return []
      },
      mention: async e => {
        let event: PrivateMessageEvent = e.value
        const value = getConfigValue()
        const config = value?.qq
        const master_key: string[] = config?.master_key ?? []
        const MessageMention: User[] = []
        for (const item of event.message) {
          if (item.type == 'at') {
            if (item.qq == 'all') continue
            const UserId = String(item.qq)
            const UserAvatar = `https://q1.qlogo.cn/g?b=qq&s=0&nk=${item.qq}`
            const UserKey = useUserHashKey({
              Platform: platform,
              UserId: UserId
            })
            MessageMention.push({
              UserId: UserId,
              UserName: '',
              UserAvatar: UserAvatar,
              UserKey: UserKey,
              IsMaster: master_key.includes(UserId),
              IsBot: item.qq == qq
            })
          }
        }
        return MessageMention
      }
    }
  }

  cbp.onactions(async (data, consume) => {
    if (data.action === 'message.send') {
      const event = data.payload.event
      const paramFormat = data.payload.params.format
      const res = await api.use.send(event, paramFormat)
      consume(res)
    } else if (data.action === 'message.send.channel') {
      // const channel_id = data.payload.ChannelId
      // const val = data.payload.params.format
      // const res = await api.active.send.channel(channel_id, val)
      // consume(res)
    } else if (data.action === 'message.send.user') {
      // const user_id = data.payload.UserId
      // const val = data.payload.params.format
      // const res = await api.active.send.user(user_id, val)
      // consume(res)
    } else if (data.action === 'mention.get') {
      const event = data.payload.event
      const res = await api.use.mention(event)
      consume(res)
    }
  })
}
