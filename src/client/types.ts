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
