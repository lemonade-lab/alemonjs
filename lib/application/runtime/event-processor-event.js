import { ResponseRouter, ResponseTree } from "./store.js";
import { createCallHandler } from "./event-processor-callHandler.js";
import { createFileTreeStep } from "./event-processor-cycleFiles.js";
import { createRouteProcessChildren } from "./event-processor-cycleRoute.js";

//#region src/application/runtime/event-processor-event.ts
const responseTreeSingleton = new ResponseTree();
const responseRouterSingleton = new ResponseRouter();
/**
* 消息体处理机制
* @param event
* @param key
*/
const expendEvent = (valueEvent, select, next) => {
	const root = responseTreeSingleton.value;
	const callHandler = createCallHandler(valueEvent);
	const nextEvent = createFileTreeStep(valueEvent, select, next, root, callHandler, "response");
	const routes = responseRouterSingleton.value;
	const callRouteHandler = createCallHandler(valueEvent);
	createRouteProcessChildren(valueEvent, select, nextEvent, callRouteHandler, "route")(routes, [], nextEvent);
};

//#endregion
export { expendEvent };