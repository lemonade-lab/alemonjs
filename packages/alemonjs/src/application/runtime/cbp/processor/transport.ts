/**
 * 传输层抽象 — 统一 直连通道 / fork IPC / WebSocket 的发送接口
 * 由 cbpClient 初始化时设置，供 sendAction / sendAPI 统一使用
 */
type SendFunc = (data: any) => void;

let _directSend: SendFunc | null = null;

/**
 * 设置直连通道的发送函数
 */
export const setDirectSend = (fn: SendFunc) => {
  _directSend = fn;
};

/**
 * 获取直连通道的发送函数（null 表示直连不可用，回退 IPC/WS）
 */
export const getDirectSend = (): SendFunc | null => _directSend;
