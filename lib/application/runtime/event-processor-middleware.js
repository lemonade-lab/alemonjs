import { MiddlewareRouter, MiddlewareTree } from "./store.js";
import { createCallHandler } from "./event-processor-callHandler.js";
import { createFileTreeStep } from "./event-processor-cycleFiles.js";
import { createRouteProcessChildren } from "./event-processor-cycleRoute.js";

//#region src/application/runtime/event-processor-middleware.ts
const middlewareTreeSingleton = new MiddlewareTree();
const middlewareRouterSingleton = new MiddlewareRouter();
/**
* 处理中间件
* @param event
* @param select
*/
const expendMiddleware = (valueEvent, select, next) => {
	const root = middlewareTreeSingleton.value;
	const callHandler = createCallHandler(valueEvent);
	const nextMiddleware = createFileTreeStep(valueEvent, select, next, root, callHandler, "middleware");
	const routes = middlewareRouterSingleton.value;
	const callRouteHandler = createCallHandler(valueEvent);
	createRouteProcessChildren(valueEvent, select, nextMiddleware, callRouteHandler, "route")(routes, [], nextMiddleware);
};

//#endregion
export { expendMiddleware };