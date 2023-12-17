/**
 * AlemonjsMessageData
 */
export interface AMessage
  extends EventBase,
    UserBase,
    MsgBase,
    Serverbase,
    BotBase,
    ReplyBase,
    MemberControllerBase,
    MessageControllerBase {}

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
  typing: (typeof TypingEnum)[number]
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
   * **********
   * 频道
   * **********
   */
  /**
   * 频道事件
   */
  'GUILD',
  /**
   * 机器人进出事件
   */
  'GUILD_BOT',
  /**
   * 子频道事件
   */
  'CHANNEL',
  /**
   * 成员进出
   */
  'GUILD_MEMBERS',
  /**
   * ***********
   * 论坛
   * *********
   */
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
   * *********
   * 会话消息
   * ********
   * MESSAGES=message
   * =MESSAGE+DIRECT+PUBLIC
   */
  /**
   * 消息
   */
  'MESSAGES',
  /**
   * 消息
   * @deprecated MESSAGES
   */
  'message',
  /**
   * 表态
   */
  'GUILD_MESSAGE_REACTIONS',
  /**
   * 按钮回调
   */
  'MESSAGE_BUTTON',
  /**
   * 互动事件监听
   */
  'INTERACTION',
  /**
   * ***********
   * 音频事件
   * ***********
   */
  /**
   * 视频
   */
  'AUDIO_FREQUENCY',
  /**
   * 麦克风
   */
  'AUDIO_MICROPHONE',
  /**
   * 审核消息
   */
  'MESSAGE_AUDIT'
] as const

/**
 * 消息判断
 */
export const TypingEnum = ['CREATE', 'UPDATE', 'DELETE'] as const

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
  guild_name: string
  /**
   * 频道头像
   */
  guild_avatar: string
  /**
   * 子频道名 | 房间名 | 群名
   */
  channel_name: string
  /**
   * 子频道编号 | 房间编号 | 群号
   */
  channel_id: string
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
  at_user: UserType | undefined
  /**
   * 艾特得到的uid即可
   */
  at_users: UserType[]
  /**
   * 消息编号
   */
  msg_id: string
  /**
   *  私聊会话
   *  存在即允许私聊
   */
  open_id: string
  /**
   * 消息创建时间
   */
  send_at: number
  /**
   * 原始消息内容
   */
  msg_txt: string
  /**
   * 附件消息
   */
  attachments: any[]
  /**
   * 特殊消息
   */
  specials: any[]
  /**
   * 纯消息
   */
  msg: string
  /**
   * 快捷接口
   */
  segment: SegmentType
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
   * @param dir 本地图片地址
   */
  img(dir: string): Buffer | false
  /**
   * 标注GET请求
   * @param url
   */
  http(url: string): string
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
   * @param url 链接地址
   */
  link?(txt: string, url: string): string
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

export interface ReplyBase {
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
    select?: MessageBingdingOption
  ): Promise<any>
}

export interface MessageBingdingOption {
  /**
   * 引用消息编号,默认不引用
   */
  quote?: string
  /**
   * 撤回毫秒数,默认不撤回
   */
  withdraw?: number
  /**
   * 频道号
   */
  guild_id?: string
  /**
   * 子频道号
   */
  channel_id?: string
  /**
   * 消息编号
   */
  msg_id?: string
  /**
   * 私聊会话标记
   */
  open_id?: string
  /**
   * 目标用户
   */
  user_id?: string
}
/**
 * 控制器可选参
 */
export interface ControllerOption {
  /**
   * 频道号
   */
  guild_id?: string
  /**
   * 子频道号
   */
  channel_id?: string
  /**
   * 消息编号
   */
  msg_id?: string
  /**
   * 用户编号
   */
  user_id?: string
  /**
   * 私聊会话识别
   */
  open_id?: string
}

interface MemberControllerBase {
  /**
   * 控制器
   * @param select 选择绑定
   */
  Member(select?: ControllerOption): MemberControllerType
}

interface MessageControllerBase {
  /**
   * 控制器
   * @param select 选择绑定
   */
  Message(select?: ControllerOption): MessageControllerType
}

export interface MemberControllerType {
  /**
   * 详细信息
   * @returns
   */
  information: () => Promise<UserInformationType | false>
  /**
   * 禁言
   * @param select { time?: number; cancel?: boolean }
   * @returns
   */
  mute: (option?: { time?: number; cancel?: boolean }) => Promise<any>
  /**
   * 移出频道
   * @returns
   */
  remove: () => Promise<any>
  /**
   * 身份/角色控制
   * @param role_id 角色id
   * @param add 是否添加 ture
   * @returns
   */
  operate: (role_id: string, add?: boolean) => Promise<any>
}

export interface UserInformationType {
  id: string
  name: string
  introduce: string
  avatar: string
  bot: boolean
  joined_at: number
  role: any[]
  isMaster: boolean
}

export interface MessageControllerType {
  /**
   * 回复消息
   * @param content
   */
  reply(
    content: Buffer | string | number | (Buffer | number | string)[]
  ): Promise<any>
  /**
   * 引用消息
   * @param content
   */
  quote(
    content: Buffer | string | number | (Buffer | number | string)[]
  ): Promise<any>
  /**
   * 更新信息
   */
  update(
    content: Buffer | string | number | (Buffer | number | string)[]
  ): Promise<any>
  /**
   * 撤回
   * @param time 撤回时间
   */
  withdraw(hideTip?: boolean): Promise<any>
  /**
   * 钉选---别野顶置--频道精华
   * @param cancel 取消
   */
  pinning(cancel?: boolean): Promise<any>
  /**
   * 喇叭--别野-精选--频道全局公告
   * @param cancel 取消
   */
  horn(cancel?: boolean): Promise<any>
  /**
   * 转发
   */
  forward(): Promise<any>
  /**
   * 表态
   * @param msg 表情
   * @param cancel 取消
   */
  emoji(msg: any[], cancel?: boolean): Promise<any[]>
  /**
   * 音频
   * 传入string视为url地址
   * 传入buffer视为二进制文件流发送
   * @param file
   * @param name
   */
  audio(file: Buffer | string, name?: string): Promise<any>
  /**
   * 视频
   * 传入string视为url地址
   * 传入buffer视为二进制文件流发送
   * @param file
   * @param name
   */
  video(file: Buffer | string, name?: string): Promise<any>
  /**
   * 发送卡片
   * @param msg
   */
  card(msg: any[]): Promise<any[]>
  /**
   * 得到指定消息的 指定 表情 下的 所有用户
   * @param msg
   * @param options
   */
  allUsers(msg: any, options: any): Promise<any>
  /**
   * 文章
   * @param msg
   */
  article(msg: any): Promise<any>
}
