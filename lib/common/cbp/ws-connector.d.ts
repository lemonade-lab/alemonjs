//#region src/common/cbp/ws-connector.d.ts
type WSConnectorOptions = {
  url: string;
  role: 'client' | 'platform';
  onOpen?: () => void;
  onMessage: (message: string) => void;
  extraHeaders?: Record<string, string>;
  globalKey: 'chatbotClient' | 'chatbotPlatform';
};
declare const createWSConnector: (options: WSConnectorOptions) => {
  heartbeatControl: {
    start: () => void;
    stop: () => void;
    pong: () => void;
  };
};
//#endregion
export { WSConnectorOptions, createWSConnector };