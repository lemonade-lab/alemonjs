import { getEventOrThrow } from "./common.js";

//#region src/application/hooks/route.ts
const createRouteReader = (params) => ({
	param: (name) => params[name],
	hasParam: (name) => Object.prototype.hasOwnProperty.call(params, name) && params[name] !== void 0
});
const createEmptyRoute = () => ({
	matched: false,
	key: void 0,
	text: void 0,
	sourceText: void 0,
	rewrittenText: void 0,
	rawArgs: [],
	parsedArgs: [],
	params: {},
	...createRouteReader({})
});
/**
* 读取当前事件的路由上下文。
* 该 hook 仅暴露只读快照，不直接暴露内部 __route 引用。
*/
const useRoute = (event) => {
	const route = getEventOrThrow(event).__route;
	if (!route) return [createEmptyRoute()];
	return [{
		matched: true,
		key: route.key,
		text: route.text,
		sourceText: route.sourceText,
		rewrittenText: route.rewrittenText ?? route.text,
		rawArgs: [...route.rawArgs],
		parsedArgs: [...route.parsedArgs],
		params: { ...route.params },
		...createRouteReader(route.params)
	}];
};

//#endregion
export { useRoute };