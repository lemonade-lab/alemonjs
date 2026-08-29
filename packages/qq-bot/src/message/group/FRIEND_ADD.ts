/**
 * 好友添加
 */
export type FRIEND_ADD_TYPE = {
  /**
   * 网关信封事件 ID（SDK 从 payload.id 回填），可用于发送消息时的 event_id 被动回复
   */
  id?: string;
  openid: string;
  timestamp: string;
};
