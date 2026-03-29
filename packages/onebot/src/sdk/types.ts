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
    }
  | {
      type: 'at';
      data: {
        qq: string;
        nickname?: string;
      };
    }
  | {
      type: 'face';
      data: {
        id: string;
      };
    }
  | {
      type: 'record';
      data: {
        file: string;
        file_id?: string;
        url?: string;
        file_size?: string;
      };
    }
  | {
      type: 'video';
      data: {
        file: string;
        file_id?: string;
        url?: string;
        file_size?: string;
      };
    }
  | {
      type: 'file';
      data: {
        file: string;
        file_id?: string;
        url?: string;
        file_size?: string;
        file_name?: string;
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

export interface META_EVENT_LIFECYCLE {
  time: number;
  // 机器人id
  self_id: number;
  // post 类型
  post_type: 'meta_event';
  meta_event_type: 'lifecycle';
  sub_type: 'connect';
}

export interface META_EVENT_HEARTBEAT {
  time: number;
  // 机器人id
  self_id: number;
  post_type: 'meta_event';
  meta_event_type: 'heartbeat';
  status: { online: boolean; good: boolean };
  interval: number;
}

export interface GROUP_RECALL {
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

/** 好友消息撤回 */
export interface NOTICE_FRIEND_RECALL_TYPE {
  time: number;
  self_id: number;
  post_type: 'notice';
  notice_type: 'friend_recall';
  user_id: number;
  message_id: number;
}

/** 群成员增加 */
export interface NOTICE_GROUP_MEMBER_INCREASE_TYPE {
  time: number;
  self_id: number;
  post_type: 'notice';
  notice_type: 'group_increase';
  group_id: number;
  user_id: number;
  operator_id: number;
  sub_type: 'approve' | 'invite';
}

/** 群成员减少 */
export interface NOTICE_GROUP_MEMBER_REDUCE_TYPE {
  time: number;
  self_id: number;
  post_type: 'notice';
  notice_type: 'group_decrease';
  group_id: number;
  user_id: number;
  operator_id: number;
  sub_type: 'leave' | 'kick' | 'kick_me';
}

/** 群禁言 */
export interface NOTICE_GROUP_BAN_TYPE {
  time: number;
  self_id: number;
  post_type: 'notice';
  notice_type: 'group_ban';
  group_id: number;
  user_id: number;
  operator_id: number;
  sub_type: 'ban' | 'lift_ban';
  duration: number;
}

/** 加群请求/邀请 */
export interface REQUEST_ADD_GROUP_TYPE {
  time: number;
  self_id: number;
  post_type: 'request';
  request_type: 'group';
  group_id: number;
  user_id: number;
  comment: string;
  flag: string;
  sub_type: 'add' | 'invite';
}

/** 群文件上传通知 */
export interface NOTICE_GROUP_UPLOAD_TYPE {
  time: number;
  self_id: number;
  post_type: 'notice';
  notice_type: 'group_upload';
  group_id: number;
  user_id: number;
  file: {
    id: string;
    name: string;
    size: number;
    busid: number;
    url?: string;
  };
}

/** 离线文件接收通知 */
export interface NOTICE_OFFLINE_FILE_TYPE {
  time: number;
  self_id: number;
  post_type: 'notice';
  notice_type: 'offline_file';
  user_id: number;
  file: {
    name: string;
    size: number;
    url: string;
  };
}

/** 群管理员变动通知 */
export interface NOTICE_GROUP_ADMIN_TYPE {
  time: number;
  self_id: number;
  post_type: 'notice';
  notice_type: 'group_admin';
  group_id: number;
  user_id: number;
  sub_type: 'set' | 'unset';
}

/** 群内戳一戳/运气王/荣誉通知 */
export interface NOTICE_NOTIFY_TYPE {
  time: number;
  self_id: number;
  post_type: 'notice';
  notice_type: 'notify';
  group_id: number;
  user_id: number;
  target_id?: number;
  sub_type: 'poke' | 'lucky_king' | 'honor';
  honor_type?: 'talkative' | 'performer' | 'emotion';
}

/** 好友已添加通知 */
export interface NOTICE_FRIEND_ADD_TYPE {
  time: number;
  self_id: number;
  post_type: 'notice';
  notice_type: 'friend_add';
  user_id: number;
}

export interface REQUEST_FRIEND {
  time: number;
  self_id: number;
  post_type: 'request';
  request_type: 'friend';
  user_id: number;
  comment: string;
  flag: string;
}
