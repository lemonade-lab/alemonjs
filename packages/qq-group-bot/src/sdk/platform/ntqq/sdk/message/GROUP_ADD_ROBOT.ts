/**
 * 群添加机器人
 */
export type GROUP_ADD_ROBOT = {
  /**
   * 操作添加机器人进群的群成员openid
   */
  group_openid: string
  /**
   * 加入群的群openid
   */
  op_member_openid: string
  /**
   * 加入的时间戳
   */
  timestamp: number
}
