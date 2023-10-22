/**
 * 阿柠檬消息类型
 */
export interface AMessage
  extends EventBase,
    UserBase,
    MsgBase,
    Serverbase,
    BotBase,
    ApiBase {}

/**
 * 事件相关
 */
interface EventBase {
  /**
   * 平台 qq | kook | villa | ntqq | discord
   */
  platform: (typeof PlatformEnum)[number]
  /**
   * 事件类型
   */
  event: (typeof EventEnum)[number]
  /**
   * 消息类型
   */
  eventType: (typeof EventType)[number]
}

/**
 * 平台枚举
 */
export const PlatformEnum = [
  'qq',
  'kook',
  'villa',
  'ntqq',
  'wechat',
  'telegram',
  'dodo',
  'discord'
] as const

/**
 * 消息枚举
 */
export const EventEnum = [
  /**
   * 频道消息
   */
  'GUILD',
  /**
   * 子频道消息
   */
  'CHANNEL',
  /**
   * 成员频道进出变动消息
   */
  'GUILD_MEMBERS',
  /**
   * 审核消息
   */
  'MESSAGE_AUDIT',
  /**
   * 私聊会话消息
   */
  'DIRECT_MESSAGE',
  /**
   * 论坛主题
   */
  'FORUMS_THREAD',
  /**
   * 论坛POST
   */
  'FORUMS_POST',
  /**
   * 论坛评论
   */
  'FORUMS_REPLY',
  /**
   * 会话消息:公私合并
   */
  'MESSAGES',
  /**
   * 小写兼容层
   */
  'message',
  /**
   * 频道表情点击会话消息
   */
  'GUILD_MESSAGE_REACTIONS',
  /**
   * 互动事件监听
   */
  'INTERACTION',
  /**
   * 音频事件
   */
  'AUDIO_FREQUENCY',
  /**
   * 麦克风事件
   */
  'AUDIO_MICROPHONE',
  /**
   * 兼容不响应
   */
  'notice.*.poke'
] as const

/**
 * 消息判断
 */
export const EventType = ['CREATE', 'UPDATE', 'DELETE'] as const

/**
 * 机器人相关
 */
interface BotBase {
  bot: {
    id: string
    name: string
    avatar?: string
  }
}

/***
 * 服务器相关
 */
interface Serverbase {
  /**
   * 频道编号 | 服务器 | 群名
   */
  guild_id: string
  /**
   *  频道名 |  服务器名 | 群号
   */
  guild_name?: string
  /**
   * 子频道名 | 房间名 | 群名
   */
  channel_name?: string
  /**
   * 子频道编号 | 房间编号 | 群号
   */
  channel_id?: string
  /**
   * 是否是私域
   */
  isPrivate: boolean
  /**
   * 是否是群聊
   */
  isGroup: boolean
}

/**
 * 消息相关
 */
interface MsgBase {
  /**
   * 是否有@
   */
  at: boolean
  /**
   * 当有艾特时
   * 第一个非机器人用户信息
   * 不管是公域或私域
   */
  at_user?: UserType | undefined
  /**
   * 艾特得到的uid即可
   */
  at_users?: UserType[]
  /**
   * 消息编号
   */
  msg_id: string
  /**
   * 消息创建时间
   */
  msg_create_time: number
  /**
   * 原始消息内容
   */
  msg_txt?: string
  /**
   * 纯消息
   */
  msg: string
  /**
   * 快捷接口
   */
  segment: markdownType
  /**
   * 是否是撤回
   */
  isRecall: boolean
}

/**
 * 用户相关
 */
interface UserBase {
  /**
   * 用户编号
   */
  user_id: string
  /**
   * 用户名
   */
  user_name: string
  /**
   * 用户头像
   */
  user_avatar: string
  /**
   * 是否是主人
   */
  isMaster: boolean
  /**
   * 权限
   */
  permissions?: permissionsType
}

/**
 * 用户类型
 */
export interface UserType {
  /**
   * 用户编号
   */
  id: string
  /**
   * 用户名称
   */
  name: string
  /**
   * 用户头像地址
   */
  avatar: string
  /**
   * 是否是机器人
   */
  bot: boolean
}

/**
 * 权限类型
 */
export interface permissionsType {
  /**
   * 可否艾特成员
   */
  at?: boolean
  /**
   * 可否艾特全体成员
   */
  atAll?: boolean
  /**
   * 可否艾特频道
   */
  atChannel?: boolean
  /**
   * 表态
   */
  statement?: {
    create?: boolean
    update?: boolean
    delete?: boolean
  }
  /**
   * 发言
   */
  speak?: {
    create?: boolean
    update?: boolean
    delete?: boolean
  }
  /**
   * 禁言
   */
  prohibition?: {
    member?: boolean
    all?: boolean
  }
  /**
   * 身份组
   */
  identityGroup?: {
    create?: boolean
    update?: boolean
    delete?: boolean
  }
  /**
   * 子频道
   */
  channel?: {
    create?: boolean
    update?: boolean
    delete?: boolean
  }
  /**
   * 公告/全局公告
   */
  Notice?: {
    create?: boolean
    update?: boolean
    delete?: boolean
  }
  /**
   * 精华 / 顶置 / 精选
   */
  essence?: {
    create?: boolean
    update?: boolean
    delete?: boolean
  }
}

/**
 * segment
 */
export interface markdownType {
  /**
   * 艾特用户
   * @param uid
   */
  at(uid: string): string
  /**
   * 艾特全体
   */
  atAll(): string
  /**
   * 艾特频道
   * @param channel_id
   */
  atChannel?(channel_id: string): string
  /**
   *
   * @param role_id 角色
   */
  role?(role_id: string): string
  /**
   *  点击后才显示
   * @param content 内容
   */
  spoiler?(content: string): string
  /**
   *
   * @param name  服务器表情名
   * @param id   服务器表情id
   */
  expression?(name: string, id: string): string
  /**
   * @param txt 链接文字
   * @param rul 链接地址
   */
  link?(txt: string, rul: string): string
  /**
   * 加粗
   * @param txt
   */
  Bold?(txt: string): string
  /**
   * 斜体
   * @param txt
   */
  italic?(txt: string): string
  /**
   * 加粗斜体
   */
  boldItalic?(txt: string): string
  /**
   * 删除线
   * @param txt
   */
  strikethrough?(txt: string): string
  /**
   * 代码块
   * @param txt
   */
  block?(txt: string): string
}

interface ApiBase
  extends replyController,
    WithdrawController,
    GuildController,
    GuildController,
    ChannelController,
    IdentityGroupController,
    UserController,
    MuteController {}

interface replyController {
  /**
   * 消息发送机制
   * @param content 消息
   * @param select.quote 引用消息编号,默认无引用
   * @param select.withdraw 撤回消息,默认不撤回
   * 文件名会进行解析后得到正确文件后缀
   */
  reply(
    content: Buffer | string | (Buffer | string)[],
    select?: {
      quote?: boolean
      withdraw?: boolean
    }
  ): Promise<boolean>

  /**
   * 发送卡片
   * @param arr
   */
  replyCard?(arr: CardType[]): Promise<boolean>

  /**
   * 公信转私信
   * QQ频道使用
   * @param content 消息
   * @param select.quote 引用消息编号,默认无引用
   * @param select.withdraw 撤回消息,默认不撤回
   * @returns
   */
  replyPrivate?(
    content: Buffer | string | (Buffer | string)[],
    select: {
      quote?: boolean
      withdraw?: boolean
    }
  ): Promise<boolean>

  /**
   * 发送表态
   * @param boj
   */
  replyEmoji?(mid: string, boj: any): Promise<boolean>

  /**
   * 删除表态
   * @param boj 表情对象
   * @returns
   */
  deleteEmoji?(mid: string, boj: any): Promise<boolean>

  /**
   * 更新表态
   * @param mid
   * @param boj
   */
  updateEmoji?(mid: string, boj: any): Promise<boolean>

  /**
   * 得到指定消息的表态
   * @param mid
   * @param boj
   */
  getEmoji?(mid: string): Promise<any[]>
}

/**
 * 撤回控制器
 */
export interface WithdrawController {
  /**
   * 撤回消息
   */
  withdraw?: (...args: any[]) => any
  /**
   * 撤回表态
   */
  withdrawReaction?: (...args: any[]) => any
}

/**
 * 频道控制器
 */
export interface GuildController {
  /**
   * 得到频道列表
   */
  getGuild?: (...args: any[]) => any
  /**
   * 得到指定频道信息
   */
  getGuildMsg?: (...args: any[]) => any
  /**
   * 得到指定频道用户
   */
  getGuildUsers?: (...args: any[]) => any
  /**
   * 删除指定频道用户
   */
  deleteGuildUser?: (...args: any[]) => any
  /**
   * 创建频道公告
   */
  createGuildAnnounce?: (...args: any[]) => any
  /**
   * 删除频道公告
   */
  deleteGuildAnnounce?: (...args: any[]) => any
}

/**
 * 子频道控制器
 */
export interface ChannelController {
  /**
   * 得到子频道列表
   */
  getChannel?: (...args: any[]) => any
  /**
   * 得到子频道信息
   */
  getChannelMsg?: (...args: any[]) => any
  /**
   * 创建子频道
   */
  createChannel?: (...args: any[]) => any
  /**
   * 更新子频道
   */
  updateChannel?: (...args: any[]) => any
  /**
   * 删除子频道
   */
  deleteChannel?: (...args: any[]) => any
  /**
   * 得到子频道权限
   */
  getChannelPermissions?: (...args: any[]) => any
  /**
   * 更新子频道权限
   */
  updateChannelPermissions?: (...args: any[]) => any
  /**
   * 创建子频道精华
   */
  createChannelAnnounce?: (...args: any[]) => any
  /**
   * 创建子频道精华
   */
  deleteChannelAnnounce?: (...args: any[]) => any
  /**
   * 创建
   */
  createChannelEssence?: (...args: any[]) => any
  /**
   * 得到
   */
  getChannelEssence?: (...args: any[]) => any
  /**
   * 删除
   */
  deleteChannelEssence?: (...args: any[]) => any
}

/**
 * 身分组控制器
 */
export interface IdentityGroupController {
  /**
   * 得到身分组
   */
  getIdentityGroup?: (...args: any[]) => any
  /**
   * 得到身分组信息
   */
  getIdentityGroupMsg?: (...args: any[]) => any
  /**
   * 创建身分组
   */
  createIdentityGroup?: (...args: any[]) => any
  /**
   * 更新身分组
   */
  updateIdentityGroup?: (...args: any[]) => any
  /**
   * 删除身分组
   */
  deleteIdentityGroup?: (...args: any[]) => any
  /**
   * 得到身分组权限
   */
  getIdentityGroupPermissions?: (...args: any[]) => any
  /**
   * 更新身份组权限
   */
  updateIdentityGroupPermissions?: (...args: any[]) => any
}

/**
 * 用户控制器
 */
export interface UserController {
  /**
   * 得到用户信息
   */
  getUserMsg?: (...args: any[]) => any
}

/**
 * 禁言控制器
 */
export interface MuteController {
  /**
   * 全体禁言
   */
  muteAll?: (...args: any[]) => any
  /**
   * 成员禁言
   */
  muteMember?: (...args: any[]) => any
  /**
   * 部分成员禁言
   */
  muteMembers?: (...args: any[]) => any
}

/**
 * 卡片枚举
 */
export const CacrdEnum = [
  /**
   * qq频道
   */
  'qq_embed',
  /**
   * QQ频道
   */
  'qq_ark',
  /**
   * kook
   */
  'kook_card'
] as const

/**
 * 卡片类型
 */
export interface CardType {
  type: (typeof CacrdEnum)[number]
  card: any
}
