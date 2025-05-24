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
  actionID?: string
}

export type ActionMentionGet = {
  // 获取提及
  action: 'mention.get'
  // 负载
  payload: {
    event: any
  }
  actionID?: string
}

export type Actions = ActionMessageSend | ActionMentionGet
