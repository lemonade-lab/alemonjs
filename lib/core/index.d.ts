import { start } from "./start.js";
import { AdapterBootTimings, AdapterPhase, AdapterProtocolVersion, AdapterTransportMode, ProcessAdapterState } from "./process/types.js";
import { getModuleAdapterState, restartModuleAdapter, startModuleAdapter } from "./process/module.js";
import { getPlatformAdapterState, restartPlatformAdapter, startPlatformAdapterWithFallback } from "./process/platform.js";
declare namespace index_d_exports {
  export { AdapterBootTimings, AdapterPhase, AdapterProtocolVersion, AdapterTransportMode, ProcessAdapterState, getModuleAdapterState, getPlatformAdapterState, restartModuleAdapter, restartPlatformAdapter, start, startModuleAdapter, startPlatformAdapterWithFallback };
}
//#endregion
export { type AdapterBootTimings, type AdapterPhase, type AdapterProtocolVersion, type AdapterTransportMode, type ProcessAdapterState, getModuleAdapterState, getPlatformAdapterState, index_d_exports, restartModuleAdapter, restartPlatformAdapter, start, startModuleAdapter, startPlatformAdapterWithFallback };