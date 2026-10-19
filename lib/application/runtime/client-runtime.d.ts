import "../define-children.js";
import "../define-middleware.js";
import "../define-response.js";
import "../define-router.js";
import "../format/message-api.js";
import "./event-response.js";
import "./event-middleware.js";
import "./event-utils.js";
import "./event-group.js";
//#region src/application/runtime/client-runtime.d.ts
declare const disposeClientRuntime: () => Promise<void>;
declare const startClientRuntime: () => Promise<void>;
//#endregion
export { disposeClientRuntime, startClientRuntime };