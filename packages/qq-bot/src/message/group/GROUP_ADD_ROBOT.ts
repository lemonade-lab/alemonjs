/**
 * 群添加机器人
 */
export type GROUP_ADD_ROBOT_TYPE = {
  /**
   * 网关信封事件 ID（SDK 从 payload.id 回填），可用于发送消息时的 event_id 被动回复
   */
  id?: string;
  /**
   * 操作添加机器人进群的群成员openid
   */
  group_openid: string;
  /**
   * 加入群的群openid
   */
  op_member_openid: string;
  /**
   * 加入的时间戳
   */
  timestamp: number;
};
