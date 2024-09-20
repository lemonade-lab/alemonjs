/**
 *
 */
export type AEventByMessageCreate = {
  UserId: string
  MsgId: string
  Megs: any[]
  Platform: string
  value: any
}

/**
 *
 */
export type AEventByMessageDelete = {
  Platform: string
  value: any
}

/**
 *
 */
export type AEventByMessageUpdate = {
  Platform: string
  value: any
}

/**
 *
 */
export type AEvents = {
  /**
   * 消息创建
   */
  'message.create': AEventByMessageCreate
  /**
   * 消息撤回
   */
  'message.delete': AEventByMessageDelete
  /**
   * 消息更新
   */
  'message.update': AEventByMessageUpdate
}
