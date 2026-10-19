import { __exportAll } from "../_virtual/_rolldown/runtime.js";
import { getPlatformAdapterState, restartPlatformAdapter, startPlatformAdapterWithFallback } from "./process/platform.js";
import { getModuleAdapterState, restartModuleAdapter, startModuleAdapter } from "./process/module.js";
import { start } from "./start.js";

//#region src/core/index.ts
var core_exports = /* @__PURE__ */ __exportAll({
	getModuleAdapterState: () => getModuleAdapterState,
	getPlatformAdapterState: () => getPlatformAdapterState,
	restartModuleAdapter: () => restartModuleAdapter,
	restartPlatformAdapter: () => restartPlatformAdapter,
	start: () => start,
	startModuleAdapter: () => startModuleAdapter,
	startPlatformAdapterWithFallback: () => startPlatformAdapterWithFallback
});

//#endregion
export { core_exports, getModuleAdapterState, getPlatformAdapterState, restartModuleAdapter, restartPlatformAdapter, start, startModuleAdapter, startPlatformAdapterWithFallback };