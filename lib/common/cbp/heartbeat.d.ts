//#region src/common/cbp/heartbeat.d.ts
declare const useHeartbeat: ({ ping, isConnected, terminate }: {
  isConnected: any;
  ping: any;
  terminate: any;
}) => {
  start: () => void;
  stop: () => void;
  pong: () => void;
}[];
//#endregion
export { useHeartbeat };