import { EventErrorPhase } from "../../types/cycle/index.js";
import "../../types/index.js";
//#region src/application/runtime/event-processor-callHandler.d.ts
declare const createCallHandler: (valueEvent: any) => (currents: any, nextEvent: any, meta?: {
  appName?: string;
  phase?: EventErrorPhase;
}) => void;
//#endregion
export { createCallHandler };