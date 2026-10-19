import { StartOptions } from "../types/run.js";
import "../types/index.js";
//#region src/core/start.d.ts
/**
 * 启动 alemonjs
 */
declare const start: (options?: StartOptions | string) => void;
//#endregion
export { start };