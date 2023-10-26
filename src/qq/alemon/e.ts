export const now_e = {
  /**
   * 卡片
   * @param obj
   * @returns
   */
  replyCard: async (obj: { type: 'embed' | 'ark'; card: any }) => {
    console.info('to be implemented')
    return false
  },
  /**
   * 引用消息
   * @param mid
   * @param boj
   * @returns
   */
  replyByMid: async (mid: string, msg: string) => {
    console.info('to be implemented')
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
    console.info('to be implemented')
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
    console.info('to be implemented')
    return false
  }
}
