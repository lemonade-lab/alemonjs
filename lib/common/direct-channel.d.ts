//#region src/common/direct-channel.d.ts
declare const generateSocketPath: () => string;
interface DirectChannel {
  send: (data: any) => void;
  close: () => void;
}
declare const createDirectServer: (sockPath: string, onMessage: (data: any) => void) => Promise<DirectChannel>;
declare const createDirectClient: (sockPath: string, onMessage: (data: any) => void, maxRetries?: number, retryDelay?: number) => Promise<DirectChannel>;
//#endregion
export { DirectChannel, createDirectClient, createDirectServer, generateSocketPath };