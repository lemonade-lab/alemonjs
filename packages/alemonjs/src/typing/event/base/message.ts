export type Message = {
  /**
   * 消息编号
   */
  MessageId: string
  /**
   * 创建时间
   */
  CreateAt: number
}

export type MessageBody = {
  /**
   * 消息内容
   */
  MessageBody: any[]
  /**
   *
   */
  MessageText: string
}
