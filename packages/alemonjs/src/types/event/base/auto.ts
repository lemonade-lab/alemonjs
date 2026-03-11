/**
 * 框架自动注入字段
 * 平台适配器无需手动设置这些字段，由 cbp.send() 自动填充
 */
export type AutoFields = {
  /**
   * 事件创建时间戳
   * 框架自动设为 Date.now()
   */
  CreateAt?: number;
  /**
   * 来源设备编号
   * 框架自动注入
   */
  DeviceId?: string;
};
