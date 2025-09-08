export type AT_MESSAGE_CREATE_TYPE = {
  attachments?: {
    // id
    id: string;
    // url
    url: string;
    // 类型
    content_type: string;
    // 文件名
    filename: string;
    // 大小
    size: number;
    // 高度
    height: number;
    // 宽度
    width: number;
  }[];
  author: {
    avatar: string;
    bot: boolean;
    id: string;
    username: string;
  };
  channel_id: string;
  content: string;
  guild_id: string;
  id: string;
  member: {
    joined_at: string;
    nick: string;
    roles: string[];
  };
  mentions: {
    avatar: string;
    bot: boolean;
    id: string;
    username: string;
  }[];
  seq: number;
  seq_in_channel: string;
  timestamp: string;
};
