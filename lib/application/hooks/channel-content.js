import { ResultCode } from "../../common/variable.js";
import { translate } from "../../common/i18n.js";
import { createResult } from "../../common/result.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import "./common.js";
import { resolveActionContext } from "./action-context.js";

//#region src/application/hooks/channel-content.ts
const action = async (name, payload) => {
	const resource = payload;
	const target = resource.target ?? (resource.ChannelId ? {
		scope: "channel",
		targetId: resource.ChannelId
	} : resource.UserId ? {
		scope: "direct",
		targetId: resource.UserId
	} : void 0);
	const results = await sendAction({
		action: name,
		payload: {
			...payload,
			...target && { target }
		}
	});
	const result = results.find((item) => item.code === ResultCode.Ok);
	return result ? createResult(ResultCode.Ok, result.message, result.data) : createResult(ResultCode.Fail, results[0]?.message || translate("action.failed", { action: name }), null);
};
/** Cross-platform scheduled channel content. */
const useSchedule = (event) => {
	const value = resolveActionContext(event);
	const channelId = (id) => id || value.ChannelId;
	return [{
		list: (params = {}) => action("schedule.list", {
			ChannelId: channelId(params.channelId),
			params
		}),
		get: (params) => action("schedule.get", {
			ChannelId: channelId(params.channelId),
			ScheduleId: params.scheduleId
		}),
		create: (params) => action("schedule.create", {
			ChannelId: channelId(params.channelId),
			params
		}),
		update: (params) => action("schedule.update", {
			ChannelId: channelId(params.channelId),
			ScheduleId: params.scheduleId,
			params
		}),
		remove: (params) => action("schedule.delete", {
			ChannelId: channelId(params.channelId),
			ScheduleId: params.scheduleId
		})
	}];
};
/** Cross-platform forum/thread content. */
const useForum = (event) => {
	const value = resolveActionContext(event);
	const channelId = (id) => id || value.ChannelId;
	return [{
		list: (params = {}) => action("forum.list", { ChannelId: channelId(params.channelId) }),
		get: (params) => action("forum.get", {
			ChannelId: channelId(params.channelId),
			ThreadId: params.threadId
		}),
		create: (params) => action("forum.create", {
			ChannelId: channelId(params.channelId),
			params
		}),
		remove: (params) => action("forum.delete", {
			ChannelId: channelId(params.channelId),
			ThreadId: params.threadId
		})
	}];
};
/** Cross-platform audio-channel controls. */
const useAudio = (event) => {
	const value = resolveActionContext(event);
	const channelId = (id) => id || value.ChannelId;
	return [{
		control: (params) => action("audio.control", {
			ChannelId: channelId(params.channelId),
			params
		}),
		join: (params = {}) => action("audio.join", { ChannelId: channelId(params.channelId) }),
		leave: (params = {}) => action("audio.leave", { ChannelId: channelId(params.channelId) }),
		online: (params = {}) => action("audio.online", { ChannelId: channelId(params.channelId) })
	}];
};
/** Channel-scoped policy, authorization, direct-session and legacy-announcement controls. */
const useChannelSettings = (event) => {
	const value = resolveActionContext(event);
	const guildId = (id) => id || value.GuildId;
	const channelId = (id) => id || value.ChannelId;
	return [{
		messageRate: (params = {}) => action("channel.message-rate.get", { GuildId: guildId(params.guildId) }),
		permissions: (params = {}) => action("channel.api-permission.list", { GuildId: guildId(params.guildId) }),
		requestPermission: (params) => action("channel.api-permission.request", {
			GuildId: guildId(params.guildId),
			ChannelId: channelId(params.channelId),
			params
		}),
		openDirectSession: (params) => action("channel.direct-session.open", {
			UserId: params.userId,
			GuildId: params.sourceGuildId || guildId()
		}),
		setLegacyAnnouncement: (params) => action("channel.legacy-announcement.set", {
			ChannelId: channelId(params.channelId),
			MessageId: params.messageId
		}),
		removeLegacyAnnouncement: (params) => action("channel.legacy-announcement.remove", {
			ChannelId: channelId(params.channelId),
			MessageId: params.messageId
		})
	}];
};

//#endregion
export { useAudio, useChannelSettings, useForum, useSchedule };