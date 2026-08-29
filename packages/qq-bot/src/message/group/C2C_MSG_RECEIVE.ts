/**
 * 推送消息打开
 */
export type C2C_MSG_RECEIVE_TYPE = {
  /**
   * 网关信封事件 ID（SDK 从 payload.id 回填），可用于发送消息时的 event_id 被动回复
   */
  id?: string;
  openid: string;
  timestamp: string;
};
