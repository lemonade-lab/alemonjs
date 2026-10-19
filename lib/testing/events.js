import { FormatEvent } from "../platform/event-format.js";

//#region src/testing/events.ts
/** Framework fields are defaults; overrides allow adapter-specific payloads. */
function createTestEvents(now = Date.now) {
	let sequence = 0;
	const event = (name, overrides = {}) => ({
		...FormatEvent.create(name).value,
		Platform: "test",
		BotId: "test-bot",
		UserId: "test-user",
		MessageId: `test-message-${++sequence}`,
		MessageText: "",
		IsPrivate: name.startsWith("private."),
		Timestamp: now(),
		...overrides
	});
	const message = (name, scope, options, overrides) => {
		const targetId = scope === "c2c" ? options.userId ?? "test-user" : options.groupId ?? options.channelId ?? "test-room";
		return event(name, {
			UserId: options.userId ?? "test-user",
			BotId: options.botId ?? "test-bot",
			Platform: options.platform ?? "test",
			MessageText: options.text ?? "",
			...options.messageId && { MessageId: options.messageId },
			Target: {
				scope,
				targetId,
				BotId: options.botId ?? "test-bot"
			},
			...scope === "group" ? {
				SpaceId: `GROUP:${targetId}`,
				ChannelId: targetId,
				GuildId: targetId
			} : {},
			...scope === "channel" ? {
				SpaceId: `GUILD:${targetId}`,
				ChannelId: targetId
			} : {},
			...overrides
		});
	};
	return {
		event,
		groupMessage: (options = {}, overrides = {}) => message("message.create", "group", options, overrides),
		channelMessage: (options = {}, overrides = {}) => message("message.create", "channel", options, overrides),
		privateMessage: (options = {}, overrides = {}) => message("private.message.create", "c2c", options, overrides),
		interaction: (options = {}, overrides = {}) => message(options.private ? "private.interaction.create" : "interaction.create", options.private ? "c2c" : "group", options, overrides)
	};
}

//#endregion
export { createTestEvents };