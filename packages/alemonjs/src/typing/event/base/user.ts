// 用户
export type User = {
  /**
   * 用户编号
   */
  UserId: string;
  /**
   * user unique id key
   * 使用`${Platform}:${UserId}`哈希所得
   * 统一长度
   */
  UserKey: string;
  /**
   * 用户名
   */
  UserName?: string;
  /**
   * 用户头像地址
   * https://
   * http://
   * base64://
   * file://
   */
  UserAvatar?: string;
  /**
   * 是否是主人
   */
  IsMaster: boolean;
  /**
   * 是否是机器人
   */
  IsBot: boolean;
};
