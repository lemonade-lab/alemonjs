import { start } from "./core/start.js";
import { getModuleAdapterState, restartModuleAdapter } from "./core/process/module.js";
import { getPlatformAdapterState, restartPlatformAdapter } from "./core/process/platform.js";
import "./core/index.js";
export { getModuleAdapterState, getPlatformAdapterState, restartModuleAdapter, restartPlatformAdapter, start };