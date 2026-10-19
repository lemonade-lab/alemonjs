import { LoggerUtils } from "../types/logger/index.js";
//#region src/common/logger.d.ts
/** Flush pending log4js writes before a process exits. */
declare const shutdownLogger: () => Promise<void>;
declare class Logger {
  #private;
  constructor();
  get value(): LoggerUtils;
}
declare const logger: LoggerUtils;
//#endregion
export { Logger, logger, shutdownLogger };