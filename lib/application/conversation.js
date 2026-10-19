import { getCurrentEvent } from "./runtime/hook-event-context.js";

//#region src/application/conversation.ts
const positive = (value, fallback, name) => {
	const number = value ?? fallback;
	if (!Number.isSafeInteger(number) || number < 1) throw new Error(`${name} must be a positive integer`);
	return number;
};
const conversationTarget = (event) => {
	if (event.Target) return event.Target;
	if (event.SpaceId?.startsWith("GROUP:")) return {
		scope: "group",
		targetId: event.SpaceId.slice(6)
	};
	if (event.OpenId?.startsWith("DIRECT:")) return {
		scope: "direct",
		targetId: event.OpenId.slice(7)
	};
	const targetId = event.IsPrivate ? event.UserId : event.ChannelId || event.GuildId;
	return targetId ? {
		scope: event.IsPrivate ? "c2c" : "channel",
		targetId
	} : void 0;
};
const conversationIdentity = (event) => {
	const target = conversationTarget(event);
	if (!event.Platform || !target?.targetId) return;
	return JSON.stringify([
		event.Platform,
		target.BotId ?? event.BotId ?? "",
		target.scope,
		target.targetId
	]);
};
/** Bounded, idle-expiring process-local storage. Returned records are copies. */
var MemoryConversationStore = class {
	maxScopes;
	now;
	#records = /* @__PURE__ */ new Map();
	constructor(maxScopes = 100, now = Date.now) {
		this.maxScopes = maxScopes;
		this.now = now;
		positive(maxScopes, 100, "maxScopes");
	}
	get(scope) {
		const record = this.#records.get(scope);
		if (!record || record.expiresAt <= this.now()) {
			this.#records.delete(scope);
			return;
		}
		this.#records.delete(scope);
		this.#records.set(scope, record);
		return structuredClone(record);
	}
	set(scope, value) {
		this.#records.delete(scope);
		while (this.#records.size >= this.maxScopes) this.#records.delete(this.#records.keys().next().value);
		this.#records.set(scope, structuredClone(value));
	}
	delete(scope) {
		this.#records.delete(scope);
	}
};
const replyRecorders = /* @__PURE__ */ new WeakMap();
const snapshots = /* @__PURE__ */ new WeakMap();
const media = (items = []) => items.slice(0, 20).map((item) => ({ ...item }));
/** Records observed messages; it never fetches unseen platform history. */
const createConversationService = (options = {}, now = Date.now) => {
	const historyLimit = positive(options.historyLimit, 50, "historyLimit");
	const referenceLimit = positive(options.referenceLimit, 200, "referenceLimit");
	const contentLimit = positive(options.contentLimit, 1e3, "contentLimit");
	const ttlMs = positive(options.ttlMs, 18e5, "ttlMs");
	const maxScopes = positive(options.maxScopes, 100, "maxScopes");
	const store = options.store ?? new MemoryConversationStore(maxScopes, now);
	const queues = /* @__PURE__ */ new Map();
	let pending = 0;
	const capture = async (event) => {
		const scope = conversationIdentity(event);
		if (!scope) return {
			scope: "",
			history: []
		};
		if (pending >= maxScopes * 2) throw new Error("Conversation capture queue is full");
		pending++;
		const task = (queues.get(scope) ?? Promise.resolve()).catch(() => void 0).then(async () => {
			const loaded = await store.get(scope);
			const record = loaded && loaded.expiresAt > now() ? loaded : {
				expiresAt: now() + ttlMs,
				history: [],
				references: []
			};
			const referenceId = event.MessageContent?.replyReferenceId;
			let quote;
			if (referenceId) {
				const elements = event.MessageContent?.elements ?? [];
				const element = elements.find((item) => item.referenceId === referenceId) ?? (elements.length === 1 && !elements[0].referenceId ? elements[0] : void 0);
				const indexed = record.references.find((item) => item.referenceId === referenceId || item.id === referenceId);
				quote = {
					referenceId,
					source: "missing"
				};
				if (element && (element.text || element.attachments?.length)) quote = {
					referenceId,
					source: "elements",
					message: {
						id: referenceId,
						referenceId,
						userId: element.userId,
						userName: element.userName,
						text: (element.text ?? "").slice(0, contentLimit),
						attachments: media(element.attachments),
						timestamp: now(),
						isBot: element.author?.IsBot === true
					}
				};
				else if (indexed) quote = {
					referenceId,
					source: "index",
					message: structuredClone(indexed)
				};
			}
			const snapshot = {
				scope,
				history: structuredClone(record.history.filter((item) => item.id !== event.MessageId).slice(-historyLimit)),
				quote
			};
			const id = event.MessageId || event.MessageContent?.referenceId;
			if (id && !record.references.some((item) => item.id === id) && !record.history.some((item) => item.id === id)) {
				const entry = {
					id,
					referenceId: event.MessageContent?.referenceId,
					userId: event.UserId,
					userName: event.UserName,
					text: (event.MessageText ?? "").slice(0, contentLimit),
					timestamp: event.OccurredAt ?? now(),
					isBot: event.IsBot === true,
					attachments: media(event.MessageMedia)
				};
				record.references = [...record.references, entry].slice(-referenceLimit);
				record.history = [...record.history, entry].slice(-historyLimit);
			}
			record.expiresAt = now() + ttlMs;
			await store.set(scope, record);
			snapshots.set(event, snapshot);
			replyRecorders.set(event, async (receipt, text) => {
				if (!receipt.id) throw new Error("A successful message receipt is required");
				await capture({
					...event,
					Target: conversationTarget(event),
					UserId: event.Target?.BotId ?? event.BotId,
					UserName: void 0,
					IsBot: true,
					MessageId: receipt.id,
					MessageText: text,
					MessageMedia: [],
					MessageContent: { referenceId: receipt.referenceId },
					OccurredAt: now()
				});
			});
			return structuredClone(snapshot);
		});
		queues.set(scope, task);
		try {
			return await task;
		} finally {
			pending--;
			if (queues.get(scope) === task) queues.delete(scope);
		}
	};
	return {
		capture,
		store
	};
};
const promptEntry = (entry) => ({
	userId: entry.userId,
	userName: entry.userName,
	text: entry.text,
	isBot: entry.isBot,
	attachments: entry.attachments.map((item) => ({
		type: item.Type,
		name: item.FileName,
		transcript: item.Transcript
	}))
});
/** A bounded JSON data envelope, not a system instruction or an LLM call.
* Quoted/history text remains untrusted user content. */
const formatConversationPrompt = (event, snapshot, options = {}) => {
	const maxChars = positive(options.maxChars, 12e3, "maxChars");
	const limit = options.historyLimit ?? 5;
	if (!Number.isSafeInteger(limit) || limit < 0) throw new Error("historyLimit must be a non-negative integer");
	const current = promptEntry({
		id: event.MessageId ?? "",
		text: event.MessageText ?? "",
		userId: event.UserId,
		userName: event.UserName,
		attachments: media(event.MessageMedia),
		timestamp: 0,
		isBot: false
	});
	const envelope = {
		...options.includeSender !== false && { sender: {
			id: event.UserId,
			name: event.UserName
		} },
		quote: options.includeQuote !== false && snapshot.quote?.message ? promptEntry(snapshot.quote.message) : void 0,
		history: limit ? snapshot.history.slice(-limit).map(promptEntry) : [],
		message: current
	};
	let result = JSON.stringify(envelope);
	while (result.length > maxChars && envelope.history.length) {
		envelope.history.shift();
		result = JSON.stringify(envelope);
	}
	if (result.length > maxChars) {
		envelope.quote = void 0;
		result = JSON.stringify(envelope);
	}
	while (result.length > maxChars && current.text.length) {
		current.text = current.text.slice(0, Math.max(0, current.text.length - Math.max(1, result.length - maxChars)));
		result = JSON.stringify(envelope);
	}
	if (result.length > maxChars) throw new Error("maxChars is too small for conversation metadata");
	return result;
};
const useConversation = (event = getCurrentEvent() ?? {}) => {
	const snapshot = structuredClone(snapshots.get(event) ?? {
		scope: conversationIdentity(event) ?? "",
		history: []
	});
	return [{
		...snapshot,
		prompt: (options) => formatConversationPrompt(event, snapshot, options),
		/** Record confirmed output explicitly, using the platform's returned reference ID. */
		rememberReply: (receipt, text) => {
			const record = replyRecorders.get(event);
			if (!record) return Promise.reject(/* @__PURE__ */ new Error("Conversation capture is not enabled for this event"));
			return record(receipt, text);
		}
	}];
};

//#endregion
export { MemoryConversationStore, conversationIdentity, createConversationService, formatConversationPrompt, useConversation };