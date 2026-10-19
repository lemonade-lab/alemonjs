import { ResultCode } from "../../common/variable.js";
import { translate } from "../../common/i18n.js";
import { createResult } from "../../common/result.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import { getCurrentEvent } from "../runtime/hook-event-context.js";
import "./common.js";

//#region src/application/hooks/action-context.ts
const resolveActionContext = (context) => {
	const event = context ?? getCurrentEvent() ?? {};
	const target = resolveActionTarget(event);
	return {
		...event,
		...target && { Target: target },
		BotId: target?.BotId ?? event.BotId,
		GuildId: event.GuildId ?? (target?.scope === "group" ? target.targetId : void 0),
		ChannelId: event.ChannelId ?? (target && ["group", "channel"].includes(target.scope) ? target.targetId : void 0),
		UserId: event.UserId ?? (target?.scope === "c2c" ? target.targetId : void 0)
	};
};
const resolveActionTarget = (context) => {
	if (context.Target) return context.Target;
	if (context.SpaceId?.startsWith("GROUP:")) return {
		scope: "group",
		targetId: context.SpaceId.slice(6),
		BotId: context.BotId
	};
	if (context.SpaceId?.startsWith("GUILD:")) return {
		scope: "channel",
		targetId: context.ChannelId || context.SpaceId.slice(6),
		BotId: context.BotId
	};
	if (context.IsPrivate && context.UserId) return {
		scope: "c2c",
		targetId: context.UserId,
		BotId: context.BotId
	};
};
/** Internal typed action dispatcher, shared by semantic public hooks. */
const createActionCaller = (context) => {
	const event = resolveActionContext(context);
	return async (action, params) => {
		try {
			const explicit = "target" in params ? params.target : void 0;
			const target = explicit ? {
				...explicit,
				BotId: explicit.BotId ?? event.BotId
			} : resolveActionTarget(event);
			const results = await sendAction({
				action,
				payload: {
					params,
					event,
					target,
					BotId: target?.BotId ?? event.BotId
				}
			});
			return results.find((result) => result.code === ResultCode.Ok) ?? results[0] ?? createResult(ResultCode.Warn, translate("action.unsupported", { action }), null);
		} catch (error) {
			return createResult(ResultCode.Fail, action, error);
		}
	};
};

//#endregion
export { createActionCaller, resolveActionContext, resolveActionTarget };