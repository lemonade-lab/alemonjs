export type Expansion = {
  /**
   * 当前事件是否至少尝试过一次消息发送。
   */
  _has_send_attempt?: boolean;
  /**
   * 当前事件是否至少成功发送过一次消息。
   */
  _has_send_success?: boolean;
  /**
   * 最近一次消息发送失败的错误信息。
   */
  _last_send_error?: string | null;
  [key: string]: any;
};
