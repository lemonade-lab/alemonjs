/** 频道消息审核结果（MESSAGE_AUDIT_PASS / MESSAGE_AUDIT_REJECT）。 */
export type GUILD_AUDIT_TYPE = {
  audit_id: string;
  audit_time: string;
  channel_id?: string;
  guild_id?: string;
  message_id?: string;
  create_time?: string;
  /** 兼容群聊审核事件；频道事件不携带该字段。 */
  group_openid?: string;
};
