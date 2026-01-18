interface Sender {
  // 用户Id
  user_id: number;
  // 昵称
  nickname: string;
  // 群名片／备注
  card: string;
  // 用户在群内的角色
  role: 'admin' | 'member';
}

type Message =
  | {
      type: 'image';
      data: {
        file: string;
        sub_type: number;
        file_id: string;
        url: string;
        file_size: string;
        file_unique: string;
      };
    }
  | {
      type: 'text';
      data: { text: string };
    }
  | {
      type: 'json';
      data: string;
    }
  | {
      type: 'forward';
      data: {
        id: number;
        content: any[];
      };
    }
  | {
      type: 'reply';
      data: {
        id: string;
      };
    };

export interface MESSAGES_TYPE {
  // 机器人id
  self_id: number;
  user_id: number;
  time: number;
  message_id: number;
  message_seq: number;
  real_id: number;
  message_type: 'group';
  sender: Sender;
  // 消息内容
  raw_message: string;
  font: number;
  sub_type: 'normal';
  message: Message[];
  // 消息类型
  message_format: 'array';
  // post 类型
  post_type: 'message';
  // 群聊
  group_id: number;
}

export interface DIRECT_MESSAGE_TYPE {
  // 机器人id
  self_id: number;
  user_id: number;
  time: number;
  message_id: number;
  message_seq: number;
  real_id: number;
  message_type: 'private';
  sender: { user_id: 1715713638; nickname: string; card: '' };
  raw_message: string;
  font: 14;
  sub_type: 'group' | 'friend';
  message: Message[];
  message_format: 'array';
  // post 类型
  post_type: 'message';
  group_id: number;
  temp_source: number;
}

export interface meta_event_lifecycle {
  time: number;
  // 机器人id
  self_id: number;
  // post 类型
  post_type: 'meta_event';
  meta_event_type: 'lifecycle';
  sub_type: 'connect';
}

export interface meta_event_heartbeat {
  time: number;
  // 机器人id
  self_id: number;
  post_type: 'meta_event';
  meta_event_type: 'heartbeat';
  status: { online: boolean; good: boolean };
  interval: number;
}

export interface group_recall {
  time: number;
  // 机器人id
  self_id: number;
  post_type: 'notice';
  group_id: number;
  user_id: number;
  notice_type: 'group_recall';
  operator_id: number;
  message_id: number;
}

export interface request_friend {
  time: number;
  self_id: number;
  post_type: 'request';
  request_type: 'friend';
  user_id: number;
  comment: string;
  flag: string;
}
