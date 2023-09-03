export const now_e = {
  /**
   * 卡片
   * @param obj
   * @returns
   */
  replyCard: async (obj: { type: 'embed' | 'ark'; card: any }) => {
    console.log('待实现')
    return false
  },
  /**
   * 引用消息
   * @param mid
   * @param boj
   * @returns
   */
  replyByMid: async (mid: string, msg: string) => {
    console.log('待实现')
    return false
  },
  /**
   * 发送表情表态
   * @param mid
   * @param boj { emoji_type: number; emoji_id: string }
   * @returns
   */
  replyEmoji: async (
    mid: string,
    boj: { emoji_type: number; emoji_id: string }
  ): Promise<boolean> => {
    console.log('待实现')
    return false
  },
  /**
   * 删除表情表态
   * @param mid
   * @param boj { emoji_type: number; emoji_id: string }
   * @returns
   */
  deleteEmoji: async (
    mid: string,
    boj: { emoji_type: number; emoji_id: string }
  ): Promise<boolean> => {
    console.log('待实现')
    return false
  },
  /**
   * 获取当前用户下的所有频道列表
   * @returns
   */
  getGuildList: async (): Promise<boolean | any[]> => {
    console.log('待实现')
    return []
  },
  /**
   * 获取频道详情
   * @param gid 频道编号
   * @returns
   */
  getGuildMsg: async (gid: string): Promise<boolean | any> => {
    console.log('待实现')
    return
  },
  /**
   * 获取子频道列表
   * @param gid 频道编号
   * @returns
   */
  getChannels: async (gid: string): Promise<boolean | any[]> => {
    console.log('待实现')
    return []
  },
  /**
   * 获取子频道详情
   * @param cid 子频道编号
   * @returns
   */
  getChannel: async (cid: string): Promise<boolean | any> => {
    console.log('待实现')
    return
  },
  /**
   * 获取频道下指定成员的信息
   * @param gid 频道
   * @param uid 用户
   * @returns
   */
  getGuildMemberMsg: async (gid: string, uid: string): Promise<boolean | any> => {
    console.log('待实现')
    return
  },
  /**
   * 撤回指定消息
   * @param cid 频道编号
   * @param mid 消息编号
   * @param hideTip 是否隐藏
   * @returns
   */
  deleteMsg: async (cid: string, mid: string, hideTip: boolean): Promise<any> => {
    console.log('待实现')
    return
  }
}
