import { EventType } from "puppeteer";
// 消息对象
export interface Message
  extends ReactionController,
    MuteController,
    UserController,
    IdentityGroupController,
    ChannelController,
    GuildController,
    ReplyController,
    WithdrawController {
  guild: GuildBasice;
  channel: ChannelBasice;
  user: UserBasice;
  robot: RobotBasice;
  message: MessageBasice;
  event: EventBasice;
}

//消息对象需要根据不同的类型,分化出不同的消息
export interface GuidMessage extends ReplyController {
  event: EventBasice;
}

// 事件枚举
export enum EventEnum {
  GUILD_MESSAGE = "GUILD_MESSAGE", // 频道|别野消息
  CHANNEL_MESSAGE = "CHANNEL_MESSAGE", // 子频道|房间消息
  MEMBER_MESSAGE = "MEMBER_MESSAGE", // 成员进出消息
  AUDIT_MESSAGE = "AUDIT_MESSAGE", // 审核消息
  MESSAGES = "MESSAGES", // 会话消息
  message = "message", // 会话消息
  PRIVATE_MESSAGE = "PRIVATE_MESSAGE", // 私聊会话消息
  FORUMS_THREAD = "FORUMS_THREAD", // 论坛主题
  FORUMS_POST = "FORUMS_POST", // 论坛推送
  FORUMS_REPLY = "FORUMS_REPLY", // 论坛评论
  REACTIONS_MESSAGE = "REACTIONS_MESSAGE", // 表态消息
  AUDIO_FREQUENCY = "AUDIO_FREQUENCY", // 音频事件
  AUDIO_MICROPHONE = "AUDIO_MICROPHONE", // 麦克风事件
}
// 事件类型
export enum EventTypeEnum {
  CREATE = "CREATE", // 创建|增加| 推送
  UPDATE = "UPDATE", // 更新|变更
  DELETE = "DELETE", // 删除|移除
}

// 子频道基础信息
export interface ChannelBasice {
  id: string; // 子频道编号
  name: string; // 子频道名
  type: string; // 子频道类ing
}

// 频道基础信息
export interface GuildBasice {
  id: string; // 频道编号
  name: string; // 频道名
  icon: string; // 频道头像
}

// 用户基础信息
export interface UserBasice {
  id: string; // 编号
  name: string; // 昵称
  avatar: string; // 头像地址
  robot: true; // 是机器人？
  master: false; // 主人？
}
// 机器人基础信息
export interface RobotBasice {
  id: string; // 编号
  name: string; // 昵称
  avatar: string; // 头像地址
  robot: true; // 是机器人？
}
// 消息基础信息
export interface MessageBasice {
  id: string; // 编号
  groupChat: true; // 是群聊(房间/子频道)
  publickSphere: true; // 公域
  at: false; // 是艾特？  注：机器人@不算@
  text: string; // 消息文本，
  atid: Array<string>; // @得到的UID集
  recall: false; // 是撤回？
  time: string; // 发送时间
}

// 事件基础信息
export interface EventBasice {
  id: string; // 事件编号
  belong: EventEnum; // 事件归属
  type: EventType | undefined; // 创建/更新/删除
}

// 回复控制器
export interface ReplyController {
  /**
   * 字符消息
   * @param msg 消息文本
   * @param img 图片元素
   * @returns
   */
  reply: (msg: string | Buffer, img: Buffer) => Promise<string | false>;
  /**
   * 图片消息
   * @param msg
   * @param obj
   * @returns
   */
  replyImage: (
    msg:
      | string // 消息文本
      | {
          image: string; // url地址
        },
    obj: {
      image: string; // url 地址
    }
  ) => Promise<string | false>;
  /**
   * 卡片消息
   * @param obj
   * @returns
   */
  replyCard: (obj: object) => Promise<string | false>;
  /**
   * 链接消息
   * @param obj
   * @returns
   */
  replyLink: (obj: object) => Promise<string | false>;
  /**
   * 标题消息
   * @param obj
   * @returns
   */
  replyTitle: (obj: object) => Promise<string | false>;
  /**
   * 转发消息
   * @param obj
   * @returns
   */
  replyForward: (obj: object) => Promise<string | false>;
  /**
   * 通知消息
   * @param obj
   * @returns
   */
  replyNotice: (obj: object) => Promise<string | false>;
  /**
   * 按钮消息
   * @param obj
   * @returns
   */
  replyButtom: (obj: object) => Promise<string | false>;
  /**
   * 引用消息
   * @param obj
   * @returns
   */
  replyQuote: (obj: object) => Promise<string | false>;
  /**
   * 表态消息
   * @param mid 消息编号
   * @param obj 表情对象
   * @returns
   */
  replyReaction: (mid: string, obj: object) => Promise<string | false>;
}

// 撤回控制器
export interface WithdrawController {
  // 撤回消息
  withdraw: () => void;
  // 撤回表态
  withdrawReation: () => void;
}

// 频道控制器
export interface GuildController {
  // 得到频道列表
  getGuild: () => void;
  // 得到指定频道信息
  getGuildMsg: () => void;
  // 得到指定频道用户
  getGuildUsers: () => void;
  // 删除指定频道用户
  deteteGuildUser: () => void;
  // 创建频道公告
  createGuildAnnounce: () => void;
  // 删除频道公告
  deleteGuildAnnounce: () => void;
}

// 子频道控制器
export interface ChannelController {
  // 得到子频道列表
  getChannel: () => void;
  // 得到子频道信息
  getChannelMsg: () => void;
  // 创建子频道
  createChannel: () => void;
  // 更新子频道
  updateChannel: () => void;
  // 删除子频道
  deleteChannel: () => void;
  // 得到子频道权限
  getChannelPermissions: () => void;
  // 更新子频道权限
  updataChannelPermissions: () => void;
  // 创建子频道精华
  createChannelAnnounce: () => void;
  // 创建子频道精华
  deleteChannelAnnounce: () => void;
  // 删除子频道
  createChannelEssence: () => void;
  //
  getChannelEssenc: () => void;
  //
  deleteChannelEssence: () => void;
}

// 身分组控制器
export interface IdentityGroupController {
  // 得到身分组
  getIdentityGroup: () => void;
  // 得到身分组信息
  getIdentityGroupMsg: () => void;
  // 创建身分组
  createIdentityGroup: () => void;
  // 更新身分组
  updataIdentityGroup: () => void;
  // 删除身分组
  deleteIdentityGroup: () => void;
  // 得到身分组权限
  getIdentityGroupPermissions: () => void;
  // 更新身份组权限
  updataIdentityGroupPermissions: () => void;
}

// 用户控制器
export interface UserController {
  // 得到用户信息
  getUserMsg: () => void;
}

// 禁言控制器
export interface MuteController {
  // 全体禁言
  muteAll: () => void;
  // 成员禁言
  muteMember: () => void;
  // 部分成员禁言
  muteMembers: () => void;
}

// 表态控制器
export interface ReactionController {
  // 得到表态列表
  getReaction: () => void;
}
