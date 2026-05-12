/**
 * 群消息审核通过
 */
export type MESSAGE_AUDIT_PASS_TYPE = {
  audit_id: string;
  audit_time: string;
  create_time?: string;
  group_openid?: string;
  message_id?: string;
};
