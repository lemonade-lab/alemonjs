import { CBPClientOptions } from "../../../../common/cbp/typings.js";
//#region src/application/runtime/cbp/connects/client.d.ts
/**
 * CBP 客户端（自动检测 直连 / IPC / WebSocket 模式）
 * 优先级：直连通道 > fork IPC > WebSocket
 * @param url
 * @param options
 */
declare const cbpClient: (url: string, options?: CBPClientOptions) => void;
//#endregion
export { cbpClient };