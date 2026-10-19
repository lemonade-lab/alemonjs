import { createActionCaller } from "./action-context.js";

//#region src/application/hooks/menu.ts
/** Configure the bot's conversation menu. */
const useMenu = (context) => {
	const call = createActionCaller(context);
	return [{
		get: () => call("menu.get", {}),
		set: (menu) => call("menu.set", { menu })
	}];
};

//#endregion
export { useMenu };