import { ProcessAdapterState } from "./types.js";
//#region src/core/process/platform.d.ts
declare const getPlatformAdapterState: () => ProcessAdapterState;
declare function restartPlatformAdapter(): void;
declare function startPlatformAdapterWithFallback(): Promise<void>;
//#endregion
export { getPlatformAdapterState, restartPlatformAdapter, startPlatformAdapterWithFallback };