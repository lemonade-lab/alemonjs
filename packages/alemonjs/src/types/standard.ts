import { User } from './event/base/user';

/**
 * 服务器/公会信息
 * 适用于: Discord Guild, QQ 频道/群, Kook 服务器, Telegram 群组, OneBot 群
 */
export type GuildInfo = {
  /** 服务器 ID */
  GuildId: string;
  /** 服务器名称 */
  GuildName?: string;
  /** 服务器图标 URL */
  GuildIcon?: string;
  /** 服务器拥有者用户 ID */
  GuildOwnerId?: string;
  /** 成员数量 */
  MemberCount?: number;
  /** 服务器描述 */
  Description?: string;
};

/**
 * 频道类型
 */
export type ChannelType = 'text' | 'voice' | 'category' | 'announcement' | 'stage' | 'forum' | 'thread' | 'unknown';

/**
 * 频道信息
 * 适用于: Discord Channel, QQ 子频道, Kook 频道
 */
export type ChannelInfo = {
  /** 频道 ID */
  ChannelId: string;
  /** 频道名称 */
  ChannelName?: string;
  /** 频道类型 */
  ChannelType?: ChannelType;
  /** 所属服务器 ID */
  GuildId?: string;
  /** 频道话题/描述 */
  Topic?: string;
  /** 排序位置 */
  Position?: number;
  /** 父级频道/分类 ID */
  ParentId?: string;
};

/**
 * 成员信息
 * 继承 User 基础字段，附加服务器内特有属性
 */
export type MemberInfo = User & {
  /** 在服务器内的昵称 */
  Nickname?: string;
  /** 所属服务器 ID */
  GuildId?: string;
  /** 拥有的角色 ID 列表 */
  Roles?: string[];
  /** 加入服务器的时间戳 (ms) */
  JoinedAt?: number;
};

/**
 * 角色信息
 */
export type RoleInfo = {
  /** 角色 ID */
  RoleId: string;
  /** 角色名称 */
  RoleName?: string;
  /** 角色颜色 (十进制整数) */
  Color?: number;
  /** 排序位置 */
  Position?: number;
  /** 权限标识 */
  Permissions?: string;
  /** 是否可被 @提及 */
  Mentionable?: boolean;
  /** 是否由集成/Bot 管理 */
  Managed?: boolean;
};

/**
 * 表情/回应信息
 */
export type ReactionInfo = {
  /** 表情 ID (平台内标识或 Unicode) */
  EmojiId: string;
  /** 表情名称 */
  EmojiName?: string;
  /** 回应数量 */
  Count?: number;
  /** 当前 Bot 是否已回应 */
  IsMe?: boolean;
};

/**
 * 分页请求参数
 */
export type PaginationParams = {
  /** 每页数量 */
  Limit?: number;
  /** 在此 ID/游标 之后 */
  After?: string;
  /** 在此 ID/游标 之前 */
  Before?: string;
};

/**
 * 通用分页结果
 */
export type PaginatedResult<T> = {
  /** 数据列表 */
  Items: T[];
  /** 总数（部分平台不支持） */
  Total?: number;
  /** 是否有更多数据 */
  HasMore?: boolean;
  /** 下一页游标 */
  NextCursor?: string;
};
