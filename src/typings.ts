// 事件枚举
export enum EventEnum {
  /* 频道|别野消息 */
  GUILD_MESSAGE = "GUILD_MESSAGE",
  /* 子频道|房间消息 */
  CHANNEL_MESSAGE = "CHANNEL_MESSAGE",
  /* 成员进出消息 */
  MEMBER_MESSAGE = "MEMBER_MESSAGE",
  /* 审核消息 */
  AUDIT_MESSAGE = "AUDIT_MESSAGE",
  /* 会话消息 */
  MESSAGES = "MESSAGES",
  /* 会话消息 */
  message = "message",
  /* 私聊会话消息 */
  PRIVATE_MESSAGE = "PRIVATE_MESSAGE",
  /* 论坛主题 */
  FORUMS_THREAD = "FORUMS_THREAD",
  /* 论坛POST */
  FORUMS_POST = "FORUMS_POST",
  /* 论坛评论 */
  FORUMS_REPLY = "FORUMS_REPLY",
  /* 表态消息 */
  REACTIONS_MESSAGE = "REACTIONS_MESSAGE",
  /* 音频事件 */
  AUDIO_FREQUENCY = "AUDIO_FREQUENCY",
  /* 麦克风事件 */
  AUDIO_MICROPHONE = "AUDIO_MICROPHONE",
}
// 事件类型
export enum EventTypeEnum {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}
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
  belong: EventEnum; // 创建/更新/删除
  type: string; // 事件类型类型
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
  withdraw: () => void;
  withdrawReation: () => void;
}

// 频道控制器
export interface GuildController {
  getGuild: () => void;
  getGuildMsg: () => void;
  getGuildUsers: () => void;
  deteteGuildUser: () => void;
  createGuildAnnounce: () => void;
  deleteGuildAnnounce: () => void;
}

// 子频道控制器
export interface ChannelController {
  getChannel: () => void;
  getChannelMsg: () => void;
  createChannel: () => void;
  updateChannel: () => void;
  deleteChannel: () => void;
  getChannelPermissions: () => void;
  updataChannelPermissions: () => void;
  createChannelAnnounce: () => void;
  deleteChannelAnnounce: () => void;
  createChannelEssence: () => void;
  getChannelEssenc: () => void;
  deleteChannelEssence: () => void;
}

// 身分组控制器
export interface IdentityGroupController {
  getIdentityGroup: () => void;
  getIdentityGroupMsg: () => void;
  createIdentityGroup: () => void;
  updataIdentityGroup: () => void;
  deleteIdentityGroup: () => void;
  getIdentityGroupPermissions: () => void;
  updataIdentityGroupPermissions: () => void;
}

// 用户控制器
export interface UserController {
  getUserMsg: () => void;
}

// 禁言控制器
export interface MuteController {
  muteAll: () => void;
  muteMember: () => void;
  muteMembers: () => void;
}

// 表态控制器
export interface ReactionController {
  getReaction: () => void;
}
