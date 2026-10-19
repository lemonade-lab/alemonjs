import { ProcessAdapterState } from "./types.js";
//#region src/core/process/module.d.ts
declare const getModuleAdapterState: () => ProcessAdapterState;
declare function restartModuleAdapter(): void;
declare function startModuleAdapter(): void;
//#endregion
export { getModuleAdapterState, restartModuleAdapter, startModuleAdapter };