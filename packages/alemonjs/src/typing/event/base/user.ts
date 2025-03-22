// 用户
export type User = {
  /**
   * 用户编号
   */
  UserId: string
  /**
   * user unique id key
   * 使用`${Platform}:${UserId}`哈希所得
   * 统一长度
   */
  UserKey: string
  /**
   * 用户名
   */
  UserName?: string
  /**
   * 用户头像地址
   */
  UserAvatar?: {
    /**
     * 头像地址
     * @returns
     */
    toURL: () => Promise<string>
    /**
     * 头像base64
     * @returns
     */
    toBase64: () => Promise<string>
    /**
     * 头像Buffer
     * @returns
     */
    toBuffer: () => Promise<Buffer>
  }
  /**
   * 是否是主人
   */
  IsMaster: boolean
  /**
   * 是否是机器人
   */
  IsBot: boolean
}
