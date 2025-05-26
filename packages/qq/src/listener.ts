import { Store } from './store'
import { PrivateMessageEvent, GroupMessageEvent } from 'icqq'
import {
  OnProcessor,
  PrivateEventMessageCreate,
  PublicEventMessageCreate,
  useUserHashKey,
  getConfigValue
} from 'alemonjs'

export const platform = 'qq'
const LocalStore = new Store()

/**
 * 上线事件
 * @returns
 */
export async function onOnline() {
  if (global.qqDesktopStatus) {
    process.send({
      type: 'qq.system.online',
      data: '已上线，欢迎使用[ @AlemonJS/QQ ]'
    })
  }
  const value = getConfigValue()
  const config = value?.qq
  const master_key: string[] = config?.master_key ?? []
  if (master_key[0]) {
    const val = LocalStore.getItem()
    const Now = Date.now()
    if (!val || !val.RunAt || Now > Now + 1000 * 60 * 24) {
      LocalStore.setItem({
        RunAt: Now
      })
      const UserId = Number(master_key[0])
      // 是否是好友
      const friend = global.client.fl.get(UserId)
      if (!friend) return
      // send
      global.client.pickUser(UserId).sendMsg('欢迎使用[ @AlemonJS/QQ ]')
    }
  }
}

/**
 * 下线事件
 * @param event
 */
export async function onOffline(event: { message: string }) {
  if (global.qqDesktopStatus) {
    process.send({
      type: 'qq.system.offline',
      data: event?.message || ''
    })
  }
  console.warn('[ @AlemonJS/QQ 下线]' + event.message)
}

/**
 * 未知事件
 * @param event
 */
export async function onSend(event: {
  /** 消息id */
  message_id: string
  seq: number
  rand: number
  time: number
}) {
  console.debug('[未知事件]', event)
}

export async function onInternalSso(cmd: string, payload: Buffer, seq: number) {
  console.debug('[隐藏事件]', {
    cmd,
    payload,
    seq
  })
}

/**
 * 监听群聊消息
 * @param event
 */
export async function onGroupMessage(event: GroupMessageEvent) {
  const value = getConfigValue()
  const config = value?.qq
  const master_key: string[] = config?.master_key ?? []
  const user_id = String(event.sender.user_id)
  const group_id = String(event.group_id)
  const isMaster = master_key.includes(user_id)

  let msg = ''

  //
  for (const val of event.message) {
    switch (val.type) {
      case 'text': {
        msg = (val?.text || '')
          .replace(/^\s*[＃井#]+\s*/, '#')
          .replace(/^\s*[\\*※＊]+\s*/, '*')
          .trim()
        break
      }
    }
  }

  const UserAvatar = `https://q1.qlogo.cn/g?b=qq&s=0&nk=${user_id}`

  const UserId = user_id
  const UserKey = useUserHashKey({
    Platform: platform,
    UserId
  })

  // 定义消
  const e: PublicEventMessageCreate = {
    name: 'message.create',
    // 事件类型
    Platform: platform,
    // 频道
    GuildId: group_id,
    ChannelId: group_id,
    // 用户
    UserId: user_id,
    UserName: event.sender.nickname,
    UserAvatar: UserAvatar,
    UserKey,
    IsMaster: isMaster,
    IsBot: false,
    // message
    MessageId: event.message_id,
    MessageText: msg,
    OpenId: user_id,
    CreateAt: Date.now(),
    // other
    tag: 'message.group',
    value: null
  }
  // 当访问的时候获取
  Object.defineProperty(e, 'value', {
    get() {
      return event
    }
  })
  // 处理消息
  OnProcessor(e, 'message.create')
}

export async function onPrivateMessage(event: PrivateMessageEvent) {
  const value = getConfigValue()
  const config = value?.qq
  const master_key: string[] = config?.master_key ?? []
  const user_id = String(event.sender.user_id)
  const isMaster = master_key.includes(user_id)
  let msg = ''
  const UserAvatar = `https://q1.qlogo.cn/g?b=qq&s=0&nk=${user_id}`

  const UserId = user_id
  const UserKey = useUserHashKey({
    Platform: platform,
    UserId
  })

  // 定义消
  const e: PrivateEventMessageCreate = {
    name: 'private.message.create',
    // 事件类型
    Platform: platform,
    // 用户
    UserId: user_id,
    UserName: event.sender.nickname,
    UserAvatar: UserAvatar,
    UserKey,
    IsMaster: isMaster,
    IsBot: false,
    // message
    MessageId: event.message_id,
    MessageText: msg,
    OpenId: user_id,
    CreateAt: Date.now(),
    // other
    tag: 'message.private',
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

/**
 * 监听是否为web模式
 * @param {*} ms 最多等待多少毫秒
 * @returns
 */
export function waitWeb(ms: number) {
  process.send({
    type: 'process.start',
    data: true
  })
  return new Promise(resolve => {
    process.on('message', async (msg: { type: string; data: any }) => {
      switch (msg.type) {
        case 'process.webview.open': {
          global.qqDesktopStatus = true
          // console.log(msg.data)
          resolve(true)
          break
        }
        case 'process.webview.close': {
          global.qqDesktopStatus = false
          break
        }
        case 'inputTicket': {
          global.inputTicket = msg.data
          break
        }
        case 'qq.login.qrcode.scaned': {
          const res = await client.queryQrcodeResult()
          // 成功
          if (res.retcode === 0) {
            console.info('\n扫码成功,开始登录...\n')
            client.qrcodeLogin()
          } else {
            process.send({
              type: 'qq.error',
              data: '状态码：' + res.retcode
            })
          }
          break
        }
        case 'qq.login.ticket': {
          await client.submitSlider(msg.data)
          break
        }
        case 'qq.device.validate.choice': {
          if (msg.data?.choice == 0) {
            await client.login()
          } else if (msg.data?.choice == 1) {
            // 发送短信验证码
            await client.sendSmsCode()
            console.info(`验证码已发送：${msg.data?.phone}\n`)
            process.send({
              type: 'qq.smscode.send',
              data: msg.data?.phone
            })
          }
          break
        }
        case 'qq.smscode': {
          await client.submitSmsCode(msg.data)
          process.send({
            type: 'qq.smscode.received',
            data: 'ok'
          })
          break
        }
        default:
      }
    })
    setTimeout(() => {
      resolve(false)
    }, ms)
  })
}
