import { createActionCaller } from "./action-context.js";

//#region src/application/hooks/panel.ts
/** Manage command panels and their audience. */
const usePanel = (context) => {
	const call = createActionCaller(context);
	return [{
		list: (params) => call("panel.list", params),
		create: (params) => call("panel.create", params),
		get: (id) => call("panel.get", { id }),
		update: (params) => call("panel.update", params),
		delete: (id) => call("panel.delete", { id }),
		updateTargets: (params) => call("panel.targets.update", params)
	}];
};

//#endregion
export { usePanel };