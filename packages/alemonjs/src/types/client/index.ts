import { Result } from '../../core/utils';
import { User } from '../event/base/user';
import { EventKeys, Events } from '../event/map';
import { DataEnums } from '../message';

export type ClientAPIMessageResult = Result & {
  data: {
    id: string;
    [key: string]: any;
  };
};

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
      send: <T extends EventKeys>(event: Events[T], val: DataEnums[]) => Promise<ClientAPIMessageResult[]>;
      /**
       * 获取提及信息
       * @param event
       * @returns
       */
      mention: <T extends EventKeys>(event: Events[T]) => Promise<User[]>;
    };
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
        channel: (channel_id: string, data: DataEnums[]) => Promise<ClientAPIMessageResult[]>;
        /**
         * 向指定用户发送消息
         * @param user_id
         * @param data
         * @returns
         */
        user: (user_id: string, data: DataEnums[]) => Promise<ClientAPIMessageResult[]>;
      };
    };
  };
  /**
   * 平台
   */
  platform: string;
};
