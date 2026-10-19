//#region src/application/runtime/load-modules/load.d.ts
/**
 * @description 运行本地模块
 * @param input
 * @returns
 */
declare const run: (input: string) => Promise<void>;
/**
 * 启动模块进程
 */
declare function loadModels(): Promise<void>;
//#endregion
export { loadModels, run };