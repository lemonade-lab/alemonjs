/**
 * api枚举
 */
export enum ApiEnum {
  /**
   * ********
   * 频道相关
   * ********
   */
  GuildList = '/api/v3/guild/list',
  GuildView = '/api/v3/guild/view',
  GuildUserList = '/api/v3/guild/user-list',
  GuildNickname = '/api/v3/guild/nickname',
  GuildLeave = '/api/v3/guild/leave',
  GuildKickout = '/api/v3/guild/kickout',
  GuildMuteList = '/api/v3/guild-mute/list',
  GuildMuteCreate = '/api/v3/guild-mute/create',
  GuildMuteDelete = '/api/v3/guild-mute/delete',
  GuildBoostHistory = '/api/v3/guild-boost/history',

  /**
   * *******
   * 子频道接口
   * ******
   */
  ChannelMessage = '/api/v3/channel/message',
  ChannelList = '/api/v3/channel/list',
  ChannelView = '/api/v3/channel/view',
  ChannelCreate = '/api/v3/channel/create',
  ChannelUpdate = '/api/v3/channel/update',
  ChannelDelete = '/api/v3/channel/delete',
  ChannelUserList = '/api/v3/channel/user-list',
  ChannelMoveUser = '/api/v3/channel/move-user',
  ChannelRoleIndex = '/api/v3/channel-role/index',
  ChannelRoleCreate = '/api/v3/channel-role/create',
  ChannelRoleUpdate = '/api/v3/channel-role/update',
  ChannelRoleSync = '/api/v3/channel-role/sync',
  ChannelRoleDelete = '/api/v3/channel-role/delete',

  /**
   * ******
   * 消息接口
   * ****
   */
  MessageList = '/api/v3/message/list',
  MessageView = '/api/v3/message/view',
  MessageCreate = '/api/v3/message/create',
  MessageUpdate = '/api/v3/message/update',
  MessageDelete = '/api/v3/message/delete',
  MessageReactionList = '/api/v3/message/reaction-list',
  MessageAddReaction = '/api/v3/message/add-reaction',
  MessageDeleteReaction = '/api/v3/message/delete-reaction',

  /**
   * *******
   * 频道用户
   * *******
   */
  GetJoinedChannel = '/api/v3/channel-user/get-joined-channel',

  /**
   * *******
   * 私聊会话
   * *******
   */

  UserChatList = '/api/v3/user-chat/list',
  UserChatView = '/api/v3/user-chat/view',
  UserChatCreate = '/api/v3/user-chat/create',
  UserChatDelete = '/api/v3/user-chat/delete',

  /**
   * *******
   * 用户私聊
   * *******
   */
  DirectMessageList = '/api/v3/direct-message/list',
  DirectMessageView = '/api/v3/direct-message/view',
  DirectMessageCreate = '/api/v3/direct-message/create',
  DirectMessageUpdate = '/api/v3/direct-message/update',
  DirectMessageDelete = '/api/v3/direct-message/delete',
  DirectMessageReactionList = '/api/v3/direct-message/reaction-list',
  DirectMessageAddReaction = '/api/v3/direct-message/add-reaction',
  DirectMessageDeleteReaction = '/api/v3/direct-message/delete-reaction',

  /**
   * ******
   * 用户接口
   * ******
   */
  UserMe = '/api/v3/user/me',
  UserView = '/api/v3/user/view',
  UserOffline = '/api/v3/user/offline',

  /**
   * *******
   * 媒体接口
   * *******
   */
  AssetCreate = '/api/v3/asset/create',

  /**
   * *******
   * 服务器角色权限相关接口列表
   * *******
   */
  GuildRoleList = '/api/v3/guild-role/list',
  GuildRoleCreate = '/api/v3/guild-role/create',
  GuildRoleUpdate = '/api/v3/guild-role/update',
  GuildRoleDelete = '/api/v3/guild-role/delete',
  GuildRoleGrant = '/api/v3/guild-role/grant',
  GuildRoleRevoke = '/api/v3/guild-role/revoke',

  /**
   * *******
   * 亲密度相关接口列表
   * *******
   */
  IntimacyIndex = '/api/v3/intimacy/index',
  IntimacyUpdate = '/api/v3/intimacy/update',

  /**
   * *******
   * 服务器表情相关接口
   * *******
   */
  GuildEmojiList = '/api/v3/guild-emoji/list',
  GuildEmojiCreate = '/api/v3/guild-emoji/create',
  GuildEmojiUpdate = '/api/v3/guild-emoji/update',
  GuildEmojiDelete = '/api/v3/guild-emoji/delete',

  /**
   * *******
   * 邀请相关接口
   * *******
   */
  InviteList = '/api/v3/invite/list',
  InviteCreate = '/api/v3/invite/create',
  InviteDelete = '/api/v3/invite/delete',

  /**
   * *******
   * 黑名单相关接口
   * *******
   */
  BlacklistList = '/api/v3/blacklist/list',
  BlacklistCreate = '/api/v3/blacklist/create',
  BlacklistDelete = '/api/v3/blacklist/delete',

  /**
   * *******
   * Badge 相关文档
   * *******
   */
  BadgeGuild = '/api/v3/badge/guild',

  /**
   * *******
   * 用户动态相关接口-游戏/进程/音乐
   * *******
   */
  GameList = '/api/v3/game',
  GameCreate = '/api/v3/game/create',
  GameUpdate = '/api/v3/game/update',
  GameDelete = '/api/v3/game/delete',
  GameActivity = '/api/v3/game/activity',
  GameDeleteActivity = '/api/v3/game/delete-activity',

  /**
   * *******
   * Gateway
   * *******
   */
  OAuth2Token = '/api/oauth2/token',

  /**
   * *******
   * OAuth2.0相关接口
   * *******
   */
  GatewayIndex = '/api/v3/gateway/index'
}

export type MessageType = 1 | 2 | 3 | 4 | 8 | 9 | 10 | 255

/**
 * 	消息通道类型, GROUP 为组播消息, PERSON 为单播消息, BROADCAST 为广播消息
 */

export type MessageChannelType = 'GROUP' | 'PERSON' | 'BROADCAST'

/**
 * 会话数据
 */
export interface EventData {
  channel_type: MessageChannelType
  type: MessageType
  target_id: string
  author_id: string
  content: string
  extra: Extra
  msg_id: string
  msg_timestamp: number
  nonce: string
  from_type: number
}

/**
 * 消息发送参数
 */
export interface SendMessageParams {
  /**
   * 消息类型
   */
  type?: number
  /**
   * 频道编号
   */
  target_id: string
  /**
   * 消息内容
   */
  content: string
  quote?: string
  nonce?: string
  temp_target_id?: string
}

/**
 * 机器人信息
 */
export interface BotInformation {
  id: string
  username: string
  identify_num: string
  online: boolean
  os: string
  status: number
  avatar: string
  banner: string
  bot: boolean
  mobile_verified: boolean
  client_id: string
  mobile_prefix: string
  mobile: string
  invited_count: number
}

/**
 * 作者信息
 */
export interface Author {
  id: string
  username: string
  identify_num: string
  online: boolean
  os: string
  status: number
  avatar: string
  vip_avatar: string
  banner: string
  nickname: string
  roles: string[]
  is_vip: boolean
  vip_amp: boolean
  is_ai_reduce_noise: boolean
  is_personal_card_bg: boolean
  bot: boolean
  decorations_id_map: null | unknown // 根据实际情况调整类型
  is_sys: boolean
}

/**
 * mk接口
 */
export interface KMarkdown {
  raw_content: string
  mention_part: any[] // 根据实际情况调整类型
  mention_role_part: any[] // 根据实际情况调整类型
  channel_part: any[] // 根据实际情况调整类型
}

/**
 * 数据包
 */
export interface Extra {
  type: number
  code: string
  guild_id: string
  guild_type: number
  channel_name: string
  author: Author
  visible_only: null // 根据实际情况调整类型
  mention: any[] // 根据实际情况调整类型
  mention_all: boolean
  mention_roles: any[] // 根据实际情况调整类型
  mention_here: boolean
  nav_channels: any[] // 根据实际情况调整类型
  kmarkdown: KMarkdown
  emoji: any[] // 根据实际情况调整类型
  last_msg_content: string
  send_msg_device: number
}

/**
 * 系统数据
 */
export interface SystemData {
  // 频道类型
  channel_type: MessageChannelType
  type: number
  target_id: string
  author_id: string
  content: string
  extra: {
    // 退频道、进频道
    // 用户进出频道事件
    type: (typeof SystemDataEnum)[number]
    body: // 消息顶置
    | overheadData
      // 成员信息
      | memberData
      // 成员信息变更
      | ChannelData
      // 表态
      | StatementData
      // 消息编辑
      | EditingData
  }
  msg_id: string
  msg_timestamp: number
  nonce: string
  from_type: number
}

/**
 * 私聊消息
 */
export interface SendDirectMessageParams {
  type?: MessageType
  target_id?: string
  chat_code?: string
  content: string
  quote?: string
  nonce?: string
}

interface overheadData {
  channel_id: string
  operator_id: string
  msg_id: string
}

interface memberData {
  user_id: string
  exited_at: number
}

interface ChannelData {
  id: string
  name: string
  user_id: string
  guild_id: string
  guild_type: number
  limit_amount: number
  is_category: number
  parent_id: string
  level: number
  slow_mode: number
  topic: string
  type: number
  permission_overwrites: any[] // 权限
  permission_users: any[] // 权限
  permission_sync: number // 权限
  mode: number
  has_password: boolean
  last_msg_content: string // 频道最后的消息
  last_msg_id: string // 频道最后消息的编号
  sync_guild_region: number
  region: string
}

interface StatementData {
  channel_id: string
  emoji: {
    // 根据实际情况提供Emoji对象的属性和类型
    [key: string]: any
  }
  user_id: string
  msg_id: string
}

interface EditingData {
  version_id: string
  channel_id: string
  content: string
  mention: string[]
  mention_all: boolean
  mention_here: boolean
  mention_roles: string[]
  updated_at: number
  kmarkdown: any // 这里的类型可能需要根据实际情况进行调整
  last_msg_content: string
  embeds: any[] // 这里的类型可能需要根据实际情况进行调整
  msg_id: string
}

/**
 * 系统数据可枚举
 */
export const SystemDataEnum = [
  /**
   * 频道进出事件
   */

  // 进入频道
  'exited_guild',
  // 退出
  'joined_guild',

  /**
   * 成员上麦事件
   */

  //进入子频道
  'joined_channel',
  // 退出子频道 --- 多半是音频频道
  'exited_channel',

  /**
   * 成员信息变更事件
   * 身份组信息变更
   */

  // 更新频道信息
  'updated_channel',

  /**
   *
   */

  // 顶置消息
  'pinned_message',

  /**
   *
   */

  // 成员上线
  'guild_member_online',

  /**
   * 频道表态事件
   */

  // 添加表态
  'added_reaction',
  // 移除表态
  'deleted_reaction',

  /**
   * 消息更新
   */
  'updated_message'
] as const
