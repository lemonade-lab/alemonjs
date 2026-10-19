import { ChildProcess } from "child_process";
//#region src/core/process/ipc-bridge.d.ts
/**
 * Publish CBP traffic to the process that owns AlemonJS, when it was started
 * through child_process.fork().  This is deliberately independent from the
 * internal platform/client IPC channel: a supervising process can observe
 * login challenges without opening another WebSocket server.
 */
declare const notifyParentCBPEvent: (data: unknown) => void;
/**
 * 设置平台子进程引用
 */
declare const setPlatformChild: (child: ChildProcess | null) => void;
/**
 * 设置客户端子进程引用
 */
declare const setClientChild: (child: ChildProcess | null) => void;
/**
 * 获取平台子进程引用
 */
declare const getPlatformChild: () => ChildProcess;
/**
 * 获取客户端子进程引用
 */
declare const getClientChild: () => ChildProcess;
/**
 * Mirror platform traffic for an external supervisor without forwarding it to
 * the module process. Direct-IPC has already delivered the event to that
 * process, so forwarding it again would duplicate application handling.
 */
declare const observeFromPlatform: (data: unknown) => void;
/**
 * 将消息从平台子进程转发到客户端子进程（同时转发到 WebSocket 前端客户端）
 */
declare const forwardFromPlatform: (data: any) => void;
/**
 * 将消息从客户端子进程转发到平台子进程（sandbox 模式下同时转发到 testone）
 */
declare const forwardFromClient: (data: any) => void;
//#endregion
export { forwardFromClient, forwardFromPlatform, getClientChild, getPlatformChild, notifyParentCBPEvent, observeFromPlatform, setClientChild, setPlatformChild };