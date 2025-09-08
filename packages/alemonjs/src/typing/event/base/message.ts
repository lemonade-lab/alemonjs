export type Message = {
  /**
   * 消息编号
   */
  MessageId: string;
  /**
   * 创建时间
   */
  CreateAt: number;
  /**
   * 来源设备编号
   */
  DeviceId?: string;
};

export type MessageText = {
  /**
   * 消息文本
   */
  MessageText: string;
};

export type MessageOpen = {
  /**
   * 开放编号
   */
  OpenId: string;
};
