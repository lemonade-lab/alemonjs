import { User } from '../event/base/user'
import { DataEnums } from '../message'
export type ClientAPI = {
  /**
   * alemonjs接口
   */
  api: {
    /**
     * hook
     */
    use: {
      /**
       * 发送消息
       * @param event
       * @param val
       * @returns
       */
      send: (event: { [key: string]: any }, val: DataEnums[]) => Promise<any[]>
      /**
       * 获取提及信息
       * @param event
       * @returns
       */
      mention: (event: { [key: string]: any }) => Promise<User[]>
    }
    /**
     * 主动接口
     */
    active: {
      /**
       * 发送消息
       */
      send: {
        /**
         * 向指定频道发送消息
         * @param channel_id
         * @param data
         * @returns
         */
        channel: (channel_id: string, data: DataEnums[]) => Promise<any[]>
        /**
         * 向指定用户发送消息
         * @param user_id
         * @param data
         * @returns
         */
        user: (user_id: string, data: DataEnums[]) => Promise<any[]>
      }
    }
  }
  /**
   * 平台
   */
  platform: string
}
