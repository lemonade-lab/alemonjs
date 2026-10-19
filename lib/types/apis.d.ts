//#region src/types/apis.d.ts
type StandardApiName = 'client.api';
type Apis = {
  /**
   * Legacy 字段名，语义上表示 api name。
   * 当前 CBPEnvelope 已使用 `payload.api` 作为正式协议字段。
   */
  action: StandardApiName | string;
  payload: {
    event: any;
    key: string;
    params: any[];
  };
  /**
   * 标记
   */
  apiId?: string;
  DeviceId?: string;
};
//#endregion
export { Apis, StandardApiName };