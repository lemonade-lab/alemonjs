/**
 * 交互消息事件 | 按钮消息
 * @param event
 * @returns
 */
export type INTERACTION_CREATE_TYPE =
  | {
      application_id: string
      chat_type: 1 // 1: 群聊, 2: 私聊
      data: {
        resolved: {
          button_data: string
          button_id: number // 按钮ID
        }
        type: number // 11: 按钮交互
      }
      group_member_openid: string
      group_openid: string
      id: string
      scene: 'group'
      timestamp: string
      type: number // 11
      version: number // 1
    }
  | {
      application_id: string
      chat_type: 2 // 私聊
      data: {
        resolved: {
          button_data: string // 按钮数据
          button_id: number // 按钮ID
        }
        type: number // 11
      }
      id: string
      scene: 'c2c'
      timestamp: string // '2025-06-14T12:20:20+08:00'
      type: number // 11
      user_openid: string
      version: number // 1
    }
