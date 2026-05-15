export type StandardApiName = 'client.api';

export type Apis = {
  /**
   * Legacy 字段名，语义上表示 api name。
   * 当前 CBPEnvelope 已使用 `payload.api` 作为正式协议字段。
   */
  action: StandardApiName | string;
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
