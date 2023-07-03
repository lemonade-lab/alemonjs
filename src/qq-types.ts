/**
 * 用户
 */
export interface IUser {
  // 用户编号
  id: string;
  // 用户名称
  username: string;
  // 用户头像地址
  avatar: string;
  // 是否是机器人
  bot: boolean;
  union_openid: string;
  union_user_account: string;
}
/**
 * 成员
 */
export interface IMember {
  // 频道编号
  guild_id: string;
  joined_at: string;
  nick: string;
  user: IUser;
  roles: string[];
  deaf: boolean;
  mute: boolean;
}
/** 消息类型 */
export interface IMessage {
  // 消息编号
  id: string;
  // 子频道编号
  channel_id: string;
  // 频道编号
  guild_id: string;
  // 消息内容
  content: string;
  timestamp: string;
  edited_timestamp: string;
  mention_everyone: boolean;
  // 消息创建者
  author: IUser;
  //
  member: IMember;
  attachments: {
    url: string;
  }[];
  //
  embeds: {
    title: string;
    description?: string;
    prompt?: string;
    thumbnail?: {
      url: string;
    };
    fields?: {
      name: string;
    }[];
  }[];
  mentions: IUser[];
  //
  ark: {
    template_id: string;
    kv: {
      key: string;
      value: string;
      obj: {
        obj_kv: {
          key: string;
          value: string;
        }[];
      }[];
    }[];
  };
  seq?: number;
  seq_in_channel?: string;
}

/**
 * 表态
 */
export interface ReactionObj {
  // 消息编号
  message_id: string;
  // 表情类型
  emoji_type: number;
  // 表情编号
  emoji_id: string;
}

/**
 * ws配置
 */
export interface GetWsParam {
  // 应用编号
  appID: string;
  // 机器令牌
  token: string;
  // 是否是沙河环境
  sandbox?: boolean;
  // 分发推荐
  shards?: Array<number>;
  //事件响应
  intents?: Array<AvailableIntentsEventsEnum>;
  //
  maxRetry?: number;
}
/**
 * 引用类型
 */
export interface MessageReference {
  message_id: string;
  ignore_get_message_error?: boolean;
}

/**
 * qq-guiles
 */
export enum AvailableIntentsEventsEnum {
  // 频道
  GUILDS = "GUILDS",
  // 频道消息
  GUILD_MEMBERS = "GUILD_MEMBERS",
  // 私域消息
  GUILD_MESSAGES = "GUILD_MESSAGES",
  //
  GUILD_MESSAGE_REACTIONS = "GUILD_MESSAGE_REACTIONS",
  //
  DIRECT_MESSAGE = "DIRECT_MESSAGE",
  //
  FORUMS_EVENT = "FORUMS_EVENT",
  // 音频and麦克风消息
  AUDIO_ACTION = "AUDIO_ACTION",
  // 公域消息
  PUBLIC_GUILD_MESSAGES = "PUBLIC_GUILD_MESSAGES",
  //
  MESSAGE_AUDIT = "MESSAGE_AUDIT",
  //
  INTERACTION = "INTERACTION",
}

export interface IGuild {
  id: string;
  name: string;
  icon: string;
  owner_id: string;
  owner: boolean;
  member_count: number;
  max_members: number;
  description: string;
  joined_at: number;
  channels: IChannel[];
  unionworld_id: string;
  union_org_id: string;
}

export interface IChannel extends PostChannelObj {
  id: string;
  guild_id: string;
  owner_id: string;
  speak_permission?: number;
  application_id?: string;
}

interface PostChannelObj {
  name: string;
  type: ChannelType;
  sub_type?: ChannelSubType;
  position: number;
  parent_id: string;
  private_type?: number;
  private_user_ids?: string[];
  permissions?: string;
}

type ChannelType = 0 | 1 | 2 | 3 | 4 | 10005;
type ChannelSubType = 0 | 1 | 2 | 3;
