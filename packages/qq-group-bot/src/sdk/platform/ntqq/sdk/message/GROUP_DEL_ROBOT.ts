/**
 * 群移除机器人
 */
export type GROUP_ADD_ROBOT = {
  /**
   * 移除的时间戳
   */
  group_openid: string
  /**
   * 移除群的群openid
   */
  op_member_openid: string
  /**
   * 操作移除机器人退群的群成员openid
   */
  timestamp: number
}
