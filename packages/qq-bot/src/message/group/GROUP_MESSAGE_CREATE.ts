/**
 * 群消息事件
 */
export interface GROUP_MESSAGE_CREATE_TYPE {
  author: {
    bot?: boolean;
    id: string;
    member_openid: string;
    union_openid: string;
    username: string;
  };
  content: string;
  group_openid: string;
  group_id: string;
  id: string;
  mentions?: {
    bot?: boolean;
    id: string;
    is_you?: boolean;
    member_openid?: string;
    scope?: string;
    username: string;
  }[];
  timestamp: string;
  message_scene: {
    ext: string[];
    source: string;
  };
  message_type: number;
}
