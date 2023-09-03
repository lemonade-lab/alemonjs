import { GroupMessageEvent, PrivateMessageEvent, DiscussMessageEvent } from 'icqq'
//  群消息事件 | 私信事件| 讨论消息事件
export type GroupEventType = GroupMessageEvent | PrivateMessageEvent | DiscussMessageEvent

interface ContactMeta {
  contact: {
    avatar: string
    contact: string
    jumpUrl: string
    nickname: string
    tag: string
    tagIcon: string
  }
}

interface Config {
  ctime: number
  token: string
}

/**
 * 群聊分享数据类型
 */
export interface AppData {
  app: string
  desc: string
  view: string
  bizsrc: string
  ver: string
  prompt: string
  appID: string
  sourceName: string
  actionData: string
  actionData_A: string
  sourceUrl: string
  meta: ContactMeta
  config: Config
  text: string
  extraApps: string[]
  sourceAd: string
  extra: string
}
