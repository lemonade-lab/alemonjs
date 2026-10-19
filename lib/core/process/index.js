import { forwardFromClient, forwardFromPlatform, getClientChild, getPlatformChild, notifyParentCBPEvent, observeFromPlatform, setClientChild, setPlatformChild } from "./ipc-bridge.js";
import { getPlatformAdapterState, restartPlatformAdapter, startPlatformAdapterWithFallback } from "./platform.js";
import { getModuleAdapterState, restartModuleAdapter, startModuleAdapter } from "./module.js";

export { forwardFromClient, forwardFromPlatform, getClientChild, getModuleAdapterState, getPlatformAdapterState, getPlatformChild, notifyParentCBPEvent, observeFromPlatform, restartModuleAdapter, restartPlatformAdapter, setClientChild, setPlatformChild, startModuleAdapter, startPlatformAdapterWithFallback };