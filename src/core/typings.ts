/**
 * 阿柠檬消息类型
 */
export interface AMessage
  extends EventBase,
    UserBase,
    MsgBase,
    Serverbase,
    BotBase,
    replyController {}

/**
 * 事件相关
 */
interface EventBase {
  /**
   * 平台 qq | kook | villa | ntqq | discord | one
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
  'discord',
  'one'
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
  'AUDIO_MICROPHONE'
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
  /**
   * 公域 | 私域
   */
  boundaries: 'publick' | 'private'
  /**
   * 群聊 | 私聊
   */
  attribute: 'group' | 'single'
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
  msg_txt: string
  /**
   * 特殊消息
   */
  attachments: any[]
  /**
   * 纯消息
   */
  msg: string
  /**
   * 快捷接口
   */
  segment: SegmentType
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
 * segment
 */
export interface SegmentType {
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
   * @param dir 本地图片地址
   */
  img(dir: string): Buffer | false
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
   * @param url 链接地址
   */
  link?(txt: string, url: string): string
  /**
   * 标注GET请求
   * @param rul
   */
  http?(rul: string, body?: any): string
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

interface replyController {
  /**
   * 消息发送机制
   * @param content 消息
   * @param select.quote 引用消息编号,默认无引用
   * @param select.withdraw 撤回消息,默认不撤回
   * 文件名会进行解析后得到正确文件后缀
   */
  reply(
    /**
     * 消息内容
     */
    content: Buffer | string | number | (Buffer | number | string)[],
    /**
     * 选择
     */
    select?: {
      /**
       * 引用消息编号,默认不引用
       */
      quote?: string
      /**
       * 撤回毫秒数,默认不撤回
       */
      withdraw?: number
    }
  ): Promise<any>

  /**
   * 发送卡片
   * @param arr
   */
  replyCard?(arr: CardType[]): Promise<any>

  /**
   * 公信转私信
   * QQ频道使用
   * @param content 消息
   * @param select.quote 引用消息编号,默认无引用
   * @param select.withdraw 撤回消息,默认不撤回
   * @returns
   */
  replyPrivate?(
    content: Buffer | string | number | (Buffer | number | string)[],
    select: {
      quote?: string
      withdraw?: number
    }
  ): Promise<any>

  /**
   * 发送表态
   * @param boj
   */
  replyEmoji?(mid: string, boj: any): Promise<any>

  /**
   * 删除表态
   * @param boj 表情对象
   * @returns
   */
  deleteEmoji?(mid: string, boj: any): Promise<any>

  /**
   * 更新表态
   * @param mid
   * @param boj
   */
  updateEmoji?(mid: string, boj: any): Promise<any>

  /**
   * 得到指定消息的表态
   * @param mid
   * @param boj
   */
  getEmoji?(mid: string): Promise<any[]>
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
