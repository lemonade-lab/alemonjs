/** 订阅消息模板授权变更，GROUP_AND_C2C_EVENT (1 << 25)。 */
export type SUBSCRIBE_MESSAGE_STATUS_TYPE = {
  id?: string;
  group_openid?: string;
  openid?: string;
  result: {
    template_id: number;
    custom_template_id: string;
    op: 1 | 2;
    subscribe_id: string;
    subscribe_ts: number;
    update_ts: number;
  }[];
};
