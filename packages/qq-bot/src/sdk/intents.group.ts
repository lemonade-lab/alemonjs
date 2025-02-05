/**
 * 订阅枚举
 */
export const AvailableIntentsEventsEnum = [
  'GROUP_AT_MESSAGE_CREATE', // 群艾特消息
  'C2C_MESSAGE_CREATE', // 单聊消息
  'FRIEND_ADD', // 用户添加机器人
  'FRIEND_DEL', // 用户删除机器人
  'C2C_MSG_REJECT', // 拒绝机器人主动消息 | 允许机器人主动消息
  'GROUP_ADD_ROBOT', // 机器人加入群聊
  'GROUP_DEL_ROBOT', // 机器人退出群聊
  'GROUP_MSG_REJECT', // 群聊拒绝机器人主动消息
  'GROUP_MSG_RECEIVE', // 群聊接受机器人主动消息
  'INTERACTION_CREATE' // 点击回调按钮
] as const

/**
 * 订阅枚举
 */
export type IntentsGroupEnum = (typeof AvailableIntentsEventsEnum)[number]

/**
 * 订阅事件集合
 */
const intentsMap = {
  INTERACTION_CREATE: 1 << 26,
  GROUP_AT_MESSAGE_CREATE: 1 << 25,
  C2C_MESSAGE_CREATE: 1 << 25,
  FRIEND_ADD: 1 << 25,
  GROUP_ADD_ROBOT: 1 << 25
}

export function getIntentsMask(intents: IntentsGroupEnum[]) {
  let intentsMask = 0
  for (const item of intents) {
    const mask = intentsMap[item]
    if (mask) {
      intentsMask |= mask
    }
  }
  return intentsMask
}
