//#region src/application/runtime/cbp/processor/transport.d.ts
/**
 * 传输层抽象 — 统一 直连通道 / fork IPC / WebSocket 的发送接口
 * 由 cbpClient 初始化时设置，供 sendAction / sendAPI 统一使用
 */
type SendFunc = (data: any) => void;
/**
 * 设置直连通道的发送函数
 */
declare const setDirectSend: (fn: SendFunc) => void;
/**
 * 获取直连通道的发送函数（null 表示直连不可用，回退 IPC/WS）
 */
declare const getDirectSend: () => SendFunc | null;
//#endregion
export { getDirectSend, setDirectSend };