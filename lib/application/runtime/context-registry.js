import { scopedMap } from "../../common/runtime-scope.js";

//#region src/application/runtime/context-registry.ts
const activeContexts = scopedMap();
const activeContextKeysByEvent = scopedMap();
const putActiveContext = (context) => {
	const previous = activeContexts.get(context.key);
	if (previous) removeActiveContext(previous.key, previous.id);
	activeContexts.set(context.key, context);
	for (const event of context.events) {
		const keys = activeContextKeysByEvent.get(event) ?? /* @__PURE__ */ new Set();
		keys.add(context.key);
		activeContextKeysByEvent.set(event, keys);
	}
};
const removeActiveContext = (key, id) => {
	const context = activeContexts.get(key);
	if (!context || id && context.id !== id) return false;
	activeContexts.delete(key);
	for (const event of context.events) {
		const keys = activeContextKeysByEvent.get(event);
		keys?.delete(key);
		if (keys?.size === 0) activeContextKeysByEvent.delete(event);
	}
	try {
		context.onRemove?.();
	} catch {}
	return true;
};
const getActiveContextKeys = (event) => activeContextKeysByEvent.get(event) ?? /* @__PURE__ */ new Set();
const clearActiveContextsByApp = (appName) => {
	for (const context of activeContexts.values()) if (context.appName === appName) removeActiveContext(context.key, context.id);
};
const clearActiveContexts = () => {
	for (const context of [...activeContexts.values()]) removeActiveContext(context.key, context.id);
};

//#endregion
export { activeContexts, clearActiveContexts, clearActiveContextsByApp, getActiveContextKeys, putActiveContext, removeActiveContext };