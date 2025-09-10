export type Apis = {
  /**
   * 行为
   */
  action: string;
  // 负载
  payload: {
    // 事件
    event: any;
    // 方法名称
    key: string;
    // 参数
    params: any[];
  };
  /**
   * 标记
   */
  apiId?: string;
  // 来源设备编号
  DeviceId?: string;
};
