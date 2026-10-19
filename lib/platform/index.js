import { __exportAll } from "../_virtual/_rolldown/runtime.js";
import { ActionsEventEnum } from "../types/event/actions.js";
import { definePlatform } from "./define-platform.js";
import { cbpPlatform } from "./cbp-platform.js";
import { FormatEvent, wrapEvent } from "./event-format.js";
import { createEventValue } from "./event-value.js";

//#region src/platform/index.ts
var platform_exports = /* @__PURE__ */ __exportAll({
	ActionsEventEnum: () => ActionsEventEnum,
	FormatEvent: () => FormatEvent,
	cbpPlatform: () => cbpPlatform,
	createEventValue: () => createEventValue,
	definePlatform: () => definePlatform,
	wrapEvent: () => wrapEvent
});

//#endregion
export { ActionsEventEnum, FormatEvent, cbpPlatform, createEventValue, definePlatform, platform_exports, wrapEvent };