import { MEMBER_ADD_TYPE } from './message/MEMBER_ADD'
import { MEMBER_REMOVE_TYPE } from './message/MEMBER_REMOVE'
import { INTERACTION_TYPE } from './message/INTERACTION'
import { MESSAGES_DIRECT_TYPE } from './message/MESSAGES_DIRECT'
import { MESSAGES_PUBLIC_TYPE } from './message/MESSAGES_PUBLIC'
import { REACTIONS_TYPE } from './message/REACTIONS'

export const KOOKEventKey = {
  // 成员加入
  MEMBER_ADD: 'MEMBER_ADD',
  // 成员退出
  MEMBER_REMOVE: 'MEMBER_REMOVE',
  // 交互
  INTERACTION: 'INTERACTION',
  // 私聊消息
  MESSAGES_DIRECT: 'MESSAGES_DIRECT',
  // 频道消息
  MESSAGES_PUBLIC: 'MESSAGES_PUBLIC',
  // 系统消息
  REACTIONS: 'REACTIONS',
  // 错误消息
  ERROR: 'ERROR'
}

export type KOOKEventMap = {
  // 成员加入
  MEMBER_ADD: MEMBER_ADD_TYPE
  // 成员退出
  MEMBER_REMOVE: MEMBER_REMOVE_TYPE
  // 交互
  INTERACTION: INTERACTION_TYPE
  // 私聊消息
  MESSAGES_DIRECT: MESSAGES_DIRECT_TYPE
  // 频道消息
  MESSAGES_PUBLIC: MESSAGES_PUBLIC_TYPE
  // 系统消息
  REACTIONS: REACTIONS_TYPE
  // 错误消息
  ERROR: any
}
