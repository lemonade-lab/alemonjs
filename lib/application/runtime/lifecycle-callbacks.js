import { showErrorModule } from "../../common/utils.js";
import { getRuntimeCore } from "./store.js";

//#region src/application/runtime/lifecycle-callbacks.ts
const swallowLifecycleError = (error) => {
	showErrorModule(error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown lifecycle error"));
};
const getChildrenApps = () => {
	return Object.values(getRuntimeCore()?.storeChildrenApp ?? {});
};
const getChildrenApp = (name) => {
	return getRuntimeCore()?.storeChildrenApp?.[name] ?? null;
};
const dispatchEventStart = async (context) => {
	const apps = getChildrenApps();
	for (const app of apps) try {
		await app.cycle?.onEventStart?.(context);
	} catch (error) {
		swallowLifecycleError(error);
	}
};
const dispatchEventFinished = async (context) => {
	const apps = getChildrenApps();
	for (const app of apps) try {
		await app.cycle?.onEventFinished?.(context);
	} catch (error) {
		swallowLifecycleError(error);
	}
};
const dispatchHttpError = async (context) => {
	const handler = getChildrenApp(context.appName)?.cycle?.onHttpError;
	if (!handler) return false;
	try {
		return await handler(context) === "handled";
	} catch (error) {
		swallowLifecycleError(error);
		return false;
	}
};
const dispatchRuntimeStatusChange = async (context) => {
	const handler = getChildrenApp(context.appName)?.cycle?.onRuntimeStatusChange;
	if (!handler) return;
	try {
		await handler(context);
	} catch (error) {
		swallowLifecycleError(error);
	}
};
const dispatchAppReady = async (appName, store) => {
	const handler = getChildrenApp(appName)?.cycle?.onReady;
	if (!handler) return;
	await handler(store);
};
const dispatchAppDispose = async (appName, error) => {
	const app = getChildrenApp(appName);
	if (!app?.cycle) return;
	try {
		if (app.cycle.onDispose) await app.cycle.onDispose(error);
		if (app.cycle.unMounted) await app.cycle.unMounted(error);
	} catch (disposeError) {
		swallowLifecycleError(disposeError);
	}
};
const dispatchDisposeAllApps = async (error) => {
	const apps = getChildrenApps();
	for (const app of apps) await dispatchAppDispose(app.name, error);
};

//#endregion
export { dispatchAppDispose, dispatchAppReady, dispatchDisposeAllApps, dispatchEventFinished, dispatchEventStart, dispatchHttpError, dispatchRuntimeStatusChange };