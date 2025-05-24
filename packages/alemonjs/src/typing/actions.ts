import { DataEnums } from './message'

export type ActionMessageSend = {
  // 发送消息
  action: 'message.send'
  // 负载
  payload: {
    // 事件
    event: any
    // 参数
    params: {
      format?: DataEnums[]
    }
  }
}

// 主动消息
export type ActionMessageSendChannel = {
  // 主动发送消息
  action: 'message.send.channel'
  // 负载
  payload: {
    // 频道ID
    ChannelId: string
    // 参数
    params: {
      format?: DataEnums[]
    }
  }
}

export type ActionMessageSendUser = {
  // 主动发送消息
  action: 'message.send.user'
  // 负载
  payload: {
    // 用户ID
    UserId: string
    // 参数
    params: {
      format?: DataEnums[]
    }
  }
}

export type ActionMentionGet = {
  // 获取提及
  action: 'mention.get'
  // 负载
  payload: {
    event: any
  }
}

type base = {
  // 动作ID
  actionID?: string
  // 来源设备编号
  DeviceId?: string
}

export type Actions = (
  | ActionMessageSend
  | ActionMentionGet
  | ActionMessageSendChannel
  | ActionMessageSendUser
) &
  base
