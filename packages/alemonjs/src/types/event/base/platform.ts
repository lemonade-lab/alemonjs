export type Platform = {
  /**
   * 平台
   */
  Platform: string;
  /**
   * 原始消息
   */
  value: any;
  /**
   * 机器人编号
   */
  BotId?: string;
  /**
   * 当前消息是否 @ 了机器人。
   */
  IsAtMe?: boolean;
  /**
   * 当前事件是否来自私聊/私人窗口。
   */
  IsPrivate?: boolean;
};
