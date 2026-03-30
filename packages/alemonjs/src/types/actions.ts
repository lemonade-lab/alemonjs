import { DataEnums } from './message';
import { PaginationParams } from './standard';

export type ActionMessageSend = {
  // 发送消息
  action: 'message.send';
  // 负载
  payload: {
    // 事件
    event: any;
    // 参数
    params: {
      format?: DataEnums[];
    };
  };
};

// 主动消息
export type ActionMessageSendChannel = {
  // 主动发送消息
  action: 'message.send.channel';
  // 负载
  payload: {
    // 频道ID
    ChannelId: string;
    // 参数
    params: {
      format?: DataEnums[];
    };
  };
};

export type ActionMessageSendUser = {
  // 主动发送消息
  action: 'message.send.user';
  // 负载
  payload: {
    // 用户ID
    UserId: string;
    // 参数
    params: {
      format?: DataEnums[];
    };
  };
};

export type ActionMentionGet = {
  // 获取提及
  action: 'mention.get';
  // 负载
  payload: {
    event: any;
  };
};

export type ActionMessageDelete = {
  // 删除消息
  action: 'message.delete';
  // 负载
  payload: {
    // 消息ID
    MessageId: string;
    // 频道ID（部分平台需要）
    ChannelId?: string;
    // 事件
    event?: any;
  };
};

// ─── 消息编辑 ───

export type ActionMessageEdit = {
  action: 'message.edit';
  payload: {
    ChannelId: string;
    MessageId: string;
    params: {
      format?: DataEnums[];
    };
    event?: any;
  };
};

// ─── 消息置顶/取消置顶 ───

export type ActionMessagePin = {
  action: 'message.pin';
  payload: {
    ChannelId: string;
    MessageId: string;
  };
};

export type ActionMessageUnpin = {
  action: 'message.unpin';
  payload: {
    ChannelId: string;
    MessageId: string;
  };
};

// ─── 表情回应 ───

export type ActionReactionAdd = {
  action: 'reaction.add';
  payload: {
    ChannelId: string;
    MessageId: string;
    EmojiId: string;
  };
};

export type ActionReactionRemove = {
  action: 'reaction.remove';
  payload: {
    ChannelId: string;
    MessageId: string;
    EmojiId: string;
  };
};

// ─── 文件操作 ───

export type ActionFileSendChannel = {
  // 发送文件
  action: 'file.send.channel';
  // 负载
  payload: {
    // 频道ID
    ChannelId: string;
    // 参数
    params: {
      file: string;
      name?: string;
      folder?: string;
    };
  };
};

export type ActionFileSendUser = {
  // 发送文件
  action: 'file.send.user';
  // 负载
  payload: {
    // 用户ID
    UserId: string;
    // 参数
    params: {
      file: string;
      name?: string;
    };
  };
};

// ─── 消息转发 ───

export type ActionMessageForwardUser = {
  // 发送合并转发消息
  action: 'message.forward.user';
  // 负载
  payload: {
    // 用户ID
    UserId: string;
    // 参数
    params: {
      // 时间
      time?: number;
      // 消息
      content: DataEnums[];
      // 用户ID
      user_id?: string;
      // 昵称
      nickname?: string;
    }[];
  };
};

export type ActionMessageForwardChannel = {
  // 发送合并转发消息
  action: 'message.forward.channel';
  // 负载
  payload: {
    // 频道ID
    ChannelId: string;
    // 参数
    params: {
      // 时间
      time?: number;
      // 消息
      content: DataEnums[];
      // 用户ID
      user_id?: string;
      // 昵称
      nickname?: string;
    }[];
  };
};

// ─── 成员管理 ───

export type ActionMemberInfo = {
  action: 'member.info';
  payload: {
    event?: any;
    params: {
      userId: string;
      guildId?: string;
    };
  };
};

export type ActionMemberList = {
  action: 'member.list';
  payload: {
    GuildId: string;
    params?: PaginationParams;
  };
};

export type ActionMemberKick = {
  action: 'member.kick';
  payload: {
    GuildId: string;
    UserId: string;
  };
};

export type ActionMemberBan = {
  action: 'member.ban';
  payload: {
    GuildId: string;
    UserId: string;
    params?: {
      reason?: string;
      duration?: number;
    };
  };
};

export type ActionMemberUnban = {
  action: 'member.unban';
  payload: {
    GuildId: string;
    UserId: string;
  };
};

// ─── 服务器/公会 ───

export type ActionGuildInfo = {
  action: 'guild.info';
  payload: {
    GuildId: string;
  };
};

export type ActionGuildList = {
  action: 'guild.list';
  payload: object;
};

// ─── 频道管理 ───

export type ActionChannelInfo = {
  action: 'channel.info';
  payload: {
    ChannelId: string;
  };
};

export type ActionChannelList = {
  action: 'channel.list';
  payload: {
    GuildId: string;
  };
};

export type ActionChannelCreate = {
  action: 'channel.create';
  payload: {
    GuildId: string;
    params: {
      name: string;
      type?: string;
      parentId?: string;
    };
  };
};

export type ActionChannelUpdate = {
  action: 'channel.update';
  payload: {
    ChannelId: string;
    params: {
      name?: string;
      topic?: string;
      position?: number;
    };
  };
};

export type ActionChannelDelete = {
  action: 'channel.delete';
  payload: {
    ChannelId: string;
  };
};

// ─── 角色管理 ───

export type ActionRoleList = {
  action: 'role.list';
  payload: {
    GuildId: string;
  };
};

export type ActionRoleCreate = {
  action: 'role.create';
  payload: {
    GuildId: string;
    params: {
      name: string;
      color?: number;
      permissions?: string;
    };
  };
};

export type ActionRoleUpdate = {
  action: 'role.update';
  payload: {
    GuildId: string;
    RoleId: string;
    params: {
      name?: string;
      color?: number;
      permissions?: string;
    };
  };
};

export type ActionRoleDelete = {
  action: 'role.delete';
  payload: {
    GuildId: string;
    RoleId: string;
  };
};

export type ActionRoleAssign = {
  action: 'role.assign';
  payload: {
    GuildId: string;
    UserId: string;
    RoleId: string;
  };
};

export type ActionRoleRemove = {
  action: 'role.remove';
  payload: {
    GuildId: string;
    UserId: string;
    RoleId: string;
  };
};

// ─── Bot 自身信息 ───

export type ActionMeInfo = {
  action: 'me.info';
  payload: object;
};

export type ActionMeGuilds = {
  action: 'me.guilds';
  payload: object;
};

export type ActionMeThreads = {
  action: 'me.threads';
  payload: object;
};

export type ActionMeFriends = {
  action: 'me.friends';
  payload: object;
};

// ─── 获取消息 ───

export type ActionMessageGet = {
  action: 'message.get';
  payload: {
    MessageId: string;
  };
};

// ─── 服务器管理扩展 ───

export type ActionGuildUpdate = {
  action: 'guild.update';
  payload: {
    GuildId: string;
    params: {
      name?: string;
    };
  };
};

export type ActionGuildLeave = {
  action: 'guild.leave';
  payload: {
    GuildId: string;
    params?: {
      isDismiss?: boolean;
    };
  };
};

export type ActionGuildMute = {
  action: 'guild.mute';
  payload: {
    GuildId: string;
    params: {
      enable: boolean;
    };
  };
};

// ─── 成员管理扩展 ───

export type ActionMemberMute = {
  action: 'member.mute';
  payload: {
    GuildId: string;
    UserId: string;
    params: {
      duration: number;
    };
  };
};

export type ActionMemberAdmin = {
  action: 'member.admin';
  payload: {
    GuildId: string;
    UserId: string;
    params: {
      enable: boolean;
    };
  };
};

export type ActionMemberCard = {
  action: 'member.card';
  payload: {
    GuildId: string;
    UserId: string;
    params: {
      card: string;
    };
  };
};

export type ActionMemberTitle = {
  action: 'member.title';
  payload: {
    GuildId: string;
    UserId: string;
    params: {
      title: string;
      duration?: number;
    };
  };
};

// ─── 请求处理 ───

export type ActionRequestFriend = {
  action: 'request.friend';
  payload: {
    params: {
      flag: string;
      approve: boolean;
      remark?: string;
    };
  };
};

export type ActionRequestGuild = {
  action: 'request.guild';
  payload: {
    params: {
      flag: string;
      subType: string;
      approve: boolean;
      reason?: string;
    };
  };
};

// ─── 用户信息 ───

export type ActionUserInfo = {
  action: 'user.info';
  payload: {
    UserId: string;
  };
};

// ─── 媒体 ───

export type ActionMediaUpload = {
  action: 'media.upload';
  payload: {
    params: {
      /** 媒体类型：image | audio | video | file */
      type: 'image' | 'audio' | 'video' | 'file';
      /** 文件 URL 或 base64 数据 */
      url?: string;
      data?: string;
      /** 文件名 */
      name?: string;
    };
  };
};

export type ActionMediaSendChannel = {
  action: 'media.send.channel';
  payload: {
    ChannelId: string;
    params: {
      type: 'image' | 'audio' | 'video' | 'file';
      url?: string;
      data?: string;
      name?: string;
    };
  };
};

export type ActionMediaSendUser = {
  action: 'media.send.user';
  payload: {
    UserId: string;
    params: {
      type: 'image' | 'audio' | 'video' | 'file';
      url?: string;
      data?: string;
      name?: string;
    };
  };
};

// ─── 消息历史 ───

export type ActionHistoryList = {
  action: 'history.list';
  payload: {
    ChannelId: string;
    params?: {
      limit?: number;
      before?: string;
      after?: string;
    };
  };
};

// ─── 权限 ───

export type ActionPermissionGet = {
  action: 'permission.get';
  payload: {
    ChannelId: string;
    UserId: string;
  };
};

export type ActionPermissionSet = {
  action: 'permission.set';
  payload: {
    ChannelId: string;
    UserId: string;
    params: {
      allow?: string;
      deny?: string;
    };
  };
};

// ─── 表情回应列表 ───

export type ActionReactionList = {
  action: 'reaction.list';
  payload: {
    ChannelId: string;
    MessageId: string;
    EmojiId: string;
    params?: {
      limit?: number;
    };
  };
};

// ─── 成员搜索 ───

export type ActionMemberSearch = {
  action: 'member.search';
  payload: {
    GuildId: string;
    params: {
      keyword: string;
      limit?: number;
    };
  };
};

// ─── 频道公告 ───

export type ActionChannelAnnounce = {
  action: 'channel.announce';
  payload: {
    GuildId: string;
    params: {
      /** 消息 ID（设置公告），传 'all' 或留空表示删除 */
      messageId?: string;
      channelId?: string;
      /** 是否删除公告 */
      remove?: boolean;
    };
  };
};

type base = {
  // 动作ID
  actionId?: string;
  // 来源设备编号
  DeviceId?: string;
};

export type Actions = // 消息
  (
    | ActionMessageSend
    | ActionMessageSendChannel
    | ActionMessageSendUser
    | ActionMessageDelete
    | ActionMessageEdit
    | ActionMessagePin
    | ActionMessageUnpin
    // 提及
    | ActionMentionGet
    // 表情回应
    | ActionReactionAdd
    | ActionReactionRemove
    // 文件
    | ActionFileSendChannel
    | ActionFileSendUser
    // 转发
    | ActionMessageForwardUser
    | ActionMessageForwardChannel
    // 成员
    | ActionMemberInfo
    | ActionMemberList
    | ActionMemberKick
    | ActionMemberBan
    | ActionMemberUnban
    // 服务器
    | ActionGuildInfo
    | ActionGuildList
    // 频道
    | ActionChannelInfo
    | ActionChannelList
    | ActionChannelCreate
    | ActionChannelUpdate
    | ActionChannelDelete
    // 角色
    | ActionRoleList
    | ActionRoleCreate
    | ActionRoleUpdate
    | ActionRoleDelete
    | ActionRoleAssign
    | ActionRoleRemove
    // 自身
    | ActionMeInfo
    | ActionMeGuilds
    | ActionMeThreads
    | ActionMeFriends
    // 消息获取
    | ActionMessageGet
    // 服务器管理扩展
    | ActionGuildUpdate
    | ActionGuildLeave
    | ActionGuildMute
    // 成员管理扩展
    | ActionMemberMute
    | ActionMemberAdmin
    | ActionMemberCard
    | ActionMemberTitle
    // 请求处理
    | ActionRequestFriend
    | ActionRequestGuild
    // 用户信息
    | ActionUserInfo
    // 媒体
    | ActionMediaUpload
    | ActionMediaSendChannel
    | ActionMediaSendUser
    // 消息历史
    | ActionHistoryList
    // 权限
    | ActionPermissionGet
    | ActionPermissionSet
    // 表情回应列表
    | ActionReactionList
    // 成员搜索
    | ActionMemberSearch
    // 频道公告
    | ActionChannelAnnounce
    // 兜底
    | {
        action: string;
        payload: object;
      }
  ) &
    base;
