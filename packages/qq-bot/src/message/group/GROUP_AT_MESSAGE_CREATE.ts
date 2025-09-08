/**
 * 群消息事件 AT 事件
 */
export interface GROUP_AT_MESSAGE_CREATE_TYPE {
  author: {
    id: string;
    member_openid: string;
  };
  content: string;
  group_openid: string;
  group_id: string;
  id: string;
  timestamp: string;
}
