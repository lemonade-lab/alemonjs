import { WebSocket } from "ws";
//#region src/core/cbp/processor/config.d.ts
declare const childrenClient: Map<string, WebSocket>;
declare const platformClient: Map<string, WebSocket>;
declare const fullClient: Map<string, WebSocket>;
declare const childrenBind: Map<string, string>;
declare const clientBindCount: Map<string, number>;
/**
 * 绑定频道/群到客户端（同步维护计数器）
 */
declare const bindChannelToClient: (channelId: string, clientId: string) => void;
/**
 * 清理指定客户端的所有绑定记录（客户端断开时调用）
 */
declare const unbindClient: (clientId: string) => void;
//#endregion
export { bindChannelToClient, childrenBind, childrenClient, clientBindCount, fullClient, platformClient, unbindClient };