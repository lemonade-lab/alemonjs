import { showErrorModule } from "../../common/utils.js";
import { getChildrenApp } from "./store.js";

//#region src/application/runtime/event-error.ts
/**
* 分发给 app 级 onEventError。
* 返回 true 表示继续当前链路，false 表示终止。
*/
const dispatchEventError = async (context) => {
	const onEventError = getChildrenApp(context.appName)?.cycle?.onEventError;
	if (!onEventError) return false;
	try {
		return await onEventError(context) === "continue";
	} catch (error) {
		showErrorModule(error instanceof Error ? error : new Error(typeof error === "string" ? error : "onEventError failed"));
		return false;
	}
};

//#endregion
export { dispatchEventError };