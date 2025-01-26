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
    global.webviewAPI.postMessage({
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
    global.webviewAPI.postMessage({
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

  const url = `https://q1.qlogo.cn/g?b=qq&s=0&nk=${user_id}`

  const UserAvatar = {
    toBuffer: async () => {
      const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
      return Buffer.from(arrayBuffer)
    },
    toBase64: async () => {
      const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
      return Buffer.from(arrayBuffer).toString('base64')
    },
    toURL: async () => {
      return url
    }
  }

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
  const url = `https://q1.qlogo.cn/g?b=qq&s=0&nk=${user_id}`
  const UserAvatar = {
    toBuffer: async () => {
      const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
      return Buffer.from(arrayBuffer)
    },
    toBase64: async () => {
      const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
      return Buffer.from(arrayBuffer).toString('base64')
    },
    toURL: async () => {
      return url
    }
  }

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
