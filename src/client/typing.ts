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
