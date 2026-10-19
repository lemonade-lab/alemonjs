import { EventFinishedContext, EventStartContext, HttpErrorContext, RuntimeStatusChangeContext } from "../../types/cycle/index.js";
import "../../types/index.js";
//#region src/application/runtime/lifecycle-callbacks.d.ts
declare const dispatchEventStart: (context: EventStartContext) => Promise<void>;
declare const dispatchEventFinished: (context: EventFinishedContext) => Promise<void>;
declare const dispatchHttpError: (context: HttpErrorContext) => Promise<boolean>;
declare const dispatchRuntimeStatusChange: (context: RuntimeStatusChangeContext) => Promise<void>;
declare const dispatchAppReady: (appName: string, store: {
  response: any[];
  responseMiddleware: {
    [key: string]: any;
  };
  middleware: any[];
}) => Promise<void>;
declare const dispatchAppDispose: (appName: string, error?: unknown) => Promise<void>;
declare const dispatchDisposeAllApps: (error?: unknown) => Promise<void>;
//#endregion
export { dispatchAppDispose, dispatchAppReady, dispatchDisposeAllApps, dispatchEventFinished, dispatchEventStart, dispatchHttpError, dispatchRuntimeStatusChange };