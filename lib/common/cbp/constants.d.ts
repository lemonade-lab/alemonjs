//#region src/common/cbp/constants.d.ts
declare const USER_AGENT_HEADER = "user-agent";
declare const USER_AGENT_HEADER_VALUE_MAP: {
  readonly platform: 'platform';
  readonly client: 'client';
  readonly testone: 'testone';
};
declare const DEVICE_ID_HEADER = "x-device-id";
declare const FULL_RECEIVE_HEADER = "x-full-receive";
declare const timeoutTime: number;
declare const reconnectInterval: number;
declare const HEARTBEAT_INTERVAL: number;
//#endregion
export { DEVICE_ID_HEADER, FULL_RECEIVE_HEADER, HEARTBEAT_INTERVAL, USER_AGENT_HEADER, USER_AGENT_HEADER_VALUE_MAP, reconnectInterval, timeoutTime };