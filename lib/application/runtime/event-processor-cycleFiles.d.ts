import { EventKeys, Events } from "../../types/event/map.js";
import { FileTreeNode, StoreResponseItem } from "../../types/store/res.js";
import { Next } from "../../types/cycle/index.js";
import "../../types/index.js";
//#region src/application/runtime/event-processor-cycleFiles.d.ts
/**
 * 清除模块缓存（用于热更新等场景）
 */
declare const clearModuleCache: (path?: string) => void;
/**
 * @deprecated 已被 createFileTreeStep + MiddlewareTree 替代
 * 创建 next 处理函数（扁平数组版）
 * @param event
 * @param select
 */
declare const createNextStep: <T extends EventKeys>(valueEvent: Events[T], select: T, next: Next, files: StoreResponseItem[], callHandler: (currents: any, nextEvent: any) => void) => Next;
/**
 * 创建文件树版的 next 处理函数
 * 用树状 DFS 替代扁平遍历 + 运行时中间件查找，
 * 中间件在每个树层级只执行一次，不再重复
 */
declare const createFileTreeStep: <T extends EventKeys>(valueEvent: Events[T], select: T, next: Next, root: FileTreeNode, callHandler: (currents: any, nextEvent: any, meta?: {
  appName?: string;
  phase?: 'middleware' | 'response';
}) => void, phase: 'middleware' | 'response') => Next;
//#endregion
export { clearModuleCache, createFileTreeStep, createNextStep };