import { DataEnums } from "./message/index.js";
import { PaginationParams } from "./standard.js";
import { MessageDelivery, MessagingActionMap, MessagingActions, OutgoingMessage } from "./messaging.js";
//#region src/types/actions.d.ts
/** Platform-neutral destination. IDs are opaque platform identifiers. */
type ActionTargetScope = 'group' | 'c2c' | 'channel' | 'direct';
type ActionTarget = {
  scope: ActionTargetScope;
  targetId: string;
  /** Selects a specific bot when a platform has multiple bot accounts. */
  BotId?: string;
};
type MessageActionName = 'message.send' | 'message.send.channel' | 'message.send.user' | 'message.send.target' | 'message.delete' | 'message.edit' | 'message.pin' | 'message.unpin' | 'message.forward.user' | 'message.forward.channel' | 'message.get' | 'message.intent';
type MentionActionName = 'mention.get';
type ReactionActionName = 'reaction.add' | 'reaction.remove' | 'reaction.list';
type FileActionName = 'file.send.channel' | 'file.send.user';
type MemberActionName = 'member.info' | 'member.list' | 'member.kick' | 'member.ban' | 'member.unban' | 'member.mute' | 'member.admin' | 'member.card' | 'member.title' | 'member.search';
type GuildActionName = 'guild.info' | 'guild.list' | 'guild.update' | 'guild.leave' | 'guild.mute';
type ChannelActionName = 'channel.info' | 'channel.list' | 'channel.create' | 'channel.update' | 'channel.delete' | 'channel.announce';
type RoleActionName = 'role.list' | 'role.create' | 'role.update' | 'role.delete' | 'role.assign' | 'role.remove';
type MeActionName = 'me.info' | 'me.guilds' | 'me.threads' | 'me.friends';
type RequestActionName = 'request.friend' | 'request.guild';
type UserActionName = 'user.info';
type MediaActionName = 'media.upload' | 'media.send.channel' | 'media.send.user' | 'media.send';
type InteractionActionName = 'interaction.ack';
type ConnectionActionName = 'connection.status';
type HistoryActionName = 'history.list';
type PermissionActionName = 'permission.get' | 'permission.set';
/** Content features available on platforms that support scheduled events. */
type ScheduleActionName = 'schedule.list' | 'schedule.get' | 'schedule.create' | 'schedule.update' | 'schedule.delete';
/** Forum/thread content features. */
type ForumActionName = 'forum.list' | 'forum.get' | 'forum.create' | 'forum.delete';
/** Voice/audio channel features. */
type AudioActionName = 'audio.control' | 'audio.join' | 'audio.leave' | 'audio.online';
type ChannelSettingsActionName = 'channel.message-rate.get' | 'channel.api-permission.list' | 'channel.api-permission.request' | 'channel.direct-session.open' | 'channel.legacy-announcement.set' | 'channel.legacy-announcement.remove';
type StandardActionName = keyof MessagingActionMap | MessageActionName | MentionActionName | ReactionActionName | FileActionName | MemberActionName | GuildActionName | ChannelActionName | RoleActionName | MeActionName | RequestActionName | UserActionName | MediaActionName | InteractionActionName | ConnectionActionName | HistoryActionName | PermissionActionName | ScheduleActionName | ForumActionName | AudioActionName | ChannelSettingsActionName;
type ActionMessageSend = {
  action: 'message.send';
  payload: {
    event: any;
    params: MessageDelivery & {
      format?: DataEnums[];
      content?: OutgoingMessage;
    };
  };
};
type ActionMessageSendChannel = {
  action: 'message.send.channel';
  payload: {
    ChannelId: string;
    BotId?: string;
    params: {
      format?: DataEnums[];
    };
  };
};
type ActionMessageSendUser = {
  action: 'message.send.user';
  payload: {
    UserId: string;
    BotId?: string;
    params: {
      format?: DataEnums[];
    };
  };
};
/** Preferred proactive send API. Unlike legacy channel/user actions it preserves the target scope. */
type ActionMessageSendTarget = {
  action: 'message.send.target';
  payload: {
    target: ActionTarget;
    params: {
      format?: DataEnums[];
      replyId?: string;
    };
  };
};
type ActionMentionGet = {
  action: 'mention.get';
  payload: {
    event: any;
  };
};
type ActionMessageDelete = {
  action: 'message.delete';
  payload: {
    MessageId: string;
    ChannelId?: string;
    /** Preferred target routing for group/C2C/direct messages. */
    target?: ActionTarget;
    event?: any;
  };
};
type ActionInteractionAck = {
  action: 'interaction.ack';
  payload: {
    InteractionId: string;
    /** Derive this from the source interaction whenever possible. */
    target?: ActionTarget;
    params?: {
      /** Platform-defined acknowledgement result, usually 0 for success. */
      code?: number;
    };
  };
};
type ActionConnectionStatus = {
  action: 'connection.status';
  payload: {
    BotId?: string;
  };
};
type ActionMessageEdit = {
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
type ActionMessagePin = {
  action: 'message.pin';
  payload: {
    ChannelId: string;
    MessageId: string;
  };
};
type ActionMessageUnpin = {
  action: 'message.unpin';
  payload: {
    ChannelId: string;
    MessageId: string;
  };
};
type ActionReactionAdd = {
  action: 'reaction.add';
  payload: {
    ChannelId: string;
    MessageId: string;
    EmojiId: string;
  };
};
type ActionReactionRemove = {
  action: 'reaction.remove';
  payload: {
    ChannelId: string;
    MessageId: string;
    EmojiId: string;
  };
};
type ActionFileSendChannel = {
  action: 'file.send.channel';
  payload: {
    ChannelId: string;
    params: {
      file: string;
      name?: string;
      folder?: string;
    };
  };
};
type ActionFileSendUser = {
  action: 'file.send.user';
  payload: {
    UserId: string;
    params: {
      file: string;
      name?: string;
    };
  };
};
type ActionMessageForwardUser = {
  action: 'message.forward.user';
  payload: {
    UserId: string;
    params: {
      time?: number;
      content: DataEnums[];
      user_id?: string;
      nickname?: string;
    }[];
  };
};
type ActionMessageForwardChannel = {
  action: 'message.forward.channel';
  payload: {
    ChannelId: string;
    params: {
      time?: number;
      content: DataEnums[];
      user_id?: string;
      nickname?: string;
    }[];
  };
};
type ActionMemberInfo = {
  action: 'member.info';
  payload: {
    event?: any;
    params: {
      userId: string;
      guildId?: string;
    };
  };
};
type ActionMemberList = {
  action: 'member.list';
  payload: {
    GuildId: string;
    params?: PaginationParams;
  };
};
type ActionMemberKick = {
  action: 'member.kick';
  payload: {
    GuildId: string;
    UserId: string;
  };
};
type ActionMemberBan = {
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
type ActionMemberUnban = {
  action: 'member.unban';
  payload: {
    GuildId: string;
    UserId: string;
  };
};
type ActionGuildInfo = {
  action: 'guild.info';
  payload: {
    GuildId: string;
  };
};
type ActionGuildList = {
  action: 'guild.list';
  payload: object;
};
type ActionChannelInfo = {
  action: 'channel.info';
  payload: {
    ChannelId: string;
  };
};
type ActionChannelList = {
  action: 'channel.list';
  payload: {
    GuildId: string;
  };
};
type ActionChannelCreate = {
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
type ActionChannelUpdate = {
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
type ActionChannelDelete = {
  action: 'channel.delete';
  payload: {
    ChannelId: string;
  };
};
type ActionRoleList = {
  action: 'role.list';
  payload: {
    GuildId: string;
  };
};
type ActionRoleCreate = {
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
type ActionRoleUpdate = {
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
type ActionRoleDelete = {
  action: 'role.delete';
  payload: {
    GuildId: string;
    RoleId: string;
  };
};
type ActionRoleAssign = {
  action: 'role.assign';
  payload: {
    GuildId: string;
    UserId: string;
    RoleId: string;
  };
};
type ActionRoleRemove = {
  action: 'role.remove';
  payload: {
    GuildId: string;
    UserId: string;
    RoleId: string;
  };
};
type ActionMeInfo = {
  action: 'me.info';
  payload: object;
};
type ActionMeGuilds = {
  action: 'me.guilds';
  payload: object;
};
type ActionMeThreads = {
  action: 'me.threads';
  payload: object;
};
type ActionMeFriends = {
  action: 'me.friends';
  payload: object;
};
type ActionMessageGet = {
  action: 'message.get';
  payload: {
    MessageId: string;
  };
};
type ActionMessageIntent = {
  action: 'message.intent';
  payload: object;
};
type ActionGuildUpdate = {
  action: 'guild.update';
  payload: {
    GuildId: string;
    params: {
      name?: string;
    };
  };
};
type ActionGuildLeave = {
  action: 'guild.leave';
  payload: {
    GuildId: string;
    params?: {
      isDismiss?: boolean;
    };
  };
};
type ActionGuildMute = {
  action: 'guild.mute';
  payload: {
    GuildId: string;
    params: {
      enable: boolean;
    };
  };
};
type ActionMemberMute = {
  action: 'member.mute';
  payload: {
    GuildId: string;
    UserId: string;
    params: {
      duration: number;
    };
  };
};
type ActionMemberAdmin = {
  action: 'member.admin';
  payload: {
    GuildId: string;
    UserId: string;
    params: {
      enable: boolean;
    };
  };
};
type ActionMemberCard = {
  action: 'member.card';
  payload: {
    GuildId: string;
    UserId: string;
    params: {
      card: string;
    };
  };
};
type ActionMemberTitle = {
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
type ActionRequestFriend = {
  action: 'request.friend';
  payload: {
    params: {
      flag: string;
      approve: boolean;
      remark?: string;
    };
  };
};
type ActionRequestGuild = {
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
type ActionUserInfo = {
  action: 'user.info';
  payload: {
    UserId: string;
  };
};
type ActionMediaParams = {
  /** 媒体类型：image | audio | video | file */
  type: 'image' | 'audio' | 'video' | 'file';
  /** One of URL, base64 data, or a platform-prepared file identifier. */
  url?: string;
  data?: string;
  /** A path readable by the platform process; preferred for large files. */
  filePath?: string;
  fileId?: string;
  /** 文件名 */
  name?: string;
  /** Optional accompanying text when the platform supports it. */
  content?: string;
};
type ActionMediaUpload = {
  action: 'media.upload';
  payload: {
    /** Required by platforms, such as QQ, whose media upload is target-scoped. */
    target?: ActionTarget;
    params: ActionMediaParams;
  };
};
type ActionMediaSendChannel = {
  action: 'media.send.channel';
  payload: {
    ChannelId: string;
    BotId?: string;
    params: ActionMediaParams;
  };
};
type ActionMediaSendUser = {
  action: 'media.send.user';
  payload: {
    UserId: string;
    BotId?: string;
    params: ActionMediaParams;
  };
};
type ActionMediaSend = {
  action: 'media.send';
  payload: {
    target: ActionTarget;
    params: ActionMediaParams;
  };
};
type ActionHistoryList = {
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
type ActionPermissionGet = {
  action: 'permission.get';
  payload: {
    ChannelId: string;
    UserId: string;
  };
};
type ActionPermissionSet = {
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
type ActionReactionList = {
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
type ActionMemberSearch = {
  action: 'member.search';
  payload: {
    GuildId: string;
    params: {
      keyword: string;
      limit?: number;
    };
  };
};
type ActionChannelAnnounce = {
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
  actionId?: string;
  DeviceId?: string;
};
type Actions = (ActionMessageSend | ActionMessageSendChannel | ActionMessageSendUser | ActionMessageSendTarget | ActionMessageDelete | ActionInteractionAck | ActionConnectionStatus | ActionMessageEdit | ActionMessagePin | ActionMessageUnpin | ActionMentionGet | ActionReactionAdd | ActionReactionRemove | ActionFileSendChannel | ActionFileSendUser | ActionMessageForwardUser | ActionMessageForwardChannel | ActionMessageIntent | ActionMemberInfo | ActionMemberList | ActionMemberKick | ActionMemberBan | ActionMemberUnban | ActionGuildInfo | ActionGuildList | ActionChannelInfo | ActionChannelList | ActionChannelCreate | ActionChannelUpdate | ActionChannelDelete | ActionRoleList | ActionRoleCreate | ActionRoleUpdate | ActionRoleDelete | ActionRoleAssign | ActionRoleRemove | ActionMeInfo | ActionMeGuilds | ActionMeThreads | ActionMeFriends | ActionMessageGet | ActionGuildUpdate | ActionGuildLeave | ActionGuildMute | ActionMemberMute | ActionMemberAdmin | ActionMemberCard | ActionMemberTitle | ActionRequestFriend | ActionRequestGuild | ActionUserInfo | ActionMediaUpload | ActionMediaSendChannel | ActionMediaSendUser | ActionMediaSend | ActionHistoryList | ActionPermissionGet | ActionPermissionSet | ActionReactionList | ActionMemberSearch | ActionChannelAnnounce | MessagingActions | {
  action: string;
  payload: object;
}) & base;
//#endregion
export { ActionChannelAnnounce, ActionChannelCreate, ActionChannelDelete, ActionChannelInfo, ActionChannelList, ActionChannelUpdate, ActionConnectionStatus, ActionFileSendChannel, ActionFileSendUser, ActionGuildInfo, ActionGuildLeave, ActionGuildList, ActionGuildMute, ActionGuildUpdate, ActionHistoryList, ActionInteractionAck, ActionMeFriends, ActionMeGuilds, ActionMeInfo, ActionMeThreads, ActionMediaParams, ActionMediaSend, ActionMediaSendChannel, ActionMediaSendUser, ActionMediaUpload, ActionMemberAdmin, ActionMemberBan, ActionMemberCard, ActionMemberInfo, ActionMemberKick, ActionMemberList, ActionMemberMute, ActionMemberSearch, ActionMemberTitle, ActionMemberUnban, ActionMentionGet, ActionMessageDelete, ActionMessageEdit, ActionMessageForwardChannel, ActionMessageForwardUser, ActionMessageGet, ActionMessageIntent, ActionMessagePin, ActionMessageSend, ActionMessageSendChannel, ActionMessageSendTarget, ActionMessageSendUser, ActionMessageUnpin, ActionPermissionGet, ActionPermissionSet, ActionReactionAdd, ActionReactionList, ActionReactionRemove, ActionRequestFriend, ActionRequestGuild, ActionRoleAssign, ActionRoleCreate, ActionRoleDelete, ActionRoleList, ActionRoleRemove, ActionRoleUpdate, ActionTarget, ActionTargetScope, ActionUserInfo, Actions, AudioActionName, ChannelActionName, ChannelSettingsActionName, ConnectionActionName, FileActionName, ForumActionName, GuildActionName, HistoryActionName, InteractionActionName, MeActionName, MediaActionName, MemberActionName, MentionActionName, MessageActionName, PermissionActionName, ReactionActionName, RequestActionName, RoleActionName, ScheduleActionName, StandardActionName, UserActionName };