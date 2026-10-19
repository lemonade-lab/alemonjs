import { runtimeNow, runtimeScope, trackRuntimeTask } from "../../common/runtime-scope.js";
import { processorMaxMapSize, processorRepeatedClearSize, processorRepeatedClearTimeMax, processorRepeatedClearTimeMin, processorRepeatedEventTime, processorRepeatedUserTime } from "../../common/variable.js";
import { getConfigValue } from "../../common/config.js";
import { fastHash, matchIn } from "../../common/identity.js";
import { getCachedRegExp } from "../../common/utils.js";
import { dispatchEventStart } from "./lifecycle-callbacks.js";
import { ProcessorEventAutoClearMap, ProcessorEventUserAutoClearMap } from "./store.js";
import { finishCurrentTrace, withProcessorTrace } from "./hook-event-context.js";
import { conversationIdentity } from "../conversation.js";
import { captureMessageContext, checkMessageRateLimit, startMessageTyping } from "./message-processing.js";
import { expendCycle } from "./event-processor-cycle.js";

//#region src/application/runtime/event-processor.ts
/**
* 过滤掉重复消息
* @param param0
* @param MessageId
* @returns
*/
const filter = ({ Now, store, INTERVAL }, MessageId) => {
	if (store.has(MessageId)) {
		if (Now - store.get(MessageId) < INTERVAL) {
			store.set(MessageId, runtimeNow());
			return true;
		}
	}
	if (store.size >= 1e4) {
		cleanupStore({
			Now,
			store,
			INTERVAL
		});
		if (store.size >= 1e4) {
			const firstKey = store.keys().next().value;
			if (firstKey !== void 0) store.delete(firstKey);
		}
	}
	store.set(MessageId, runtimeNow());
};
/**
* 清理旧消息（带预算限制，避免大 Map 阻塞 Event Loop）
* @returns 是否全部清理完毕
*/
const CLEANUP_BUDGET = 1e3;
const cleanupStore = ({ Now, store, INTERVAL }) => {
	let cleaned = 0;
	for (const [ID, timestamp] of store.entries()) {
		if (cleaned >= CLEANUP_BUDGET) return false;
		if (Now - timestamp > INTERVAL) {
			store.delete(ID);
			cleaned++;
		}
	}
	return true;
};
/**
* 清理所有消息
*/
const cleanupStoreAll = () => {
	const Now = runtimeNow();
	const value = getConfigValue();
	const EVENT_INTERVAL = value?.processor?.repeated_event_time ?? 6e4;
	const USER_INTERVAL = value?.processor?.repeated_user_time ?? 1e3;
	const a = cleanupStore({
		Now,
		INTERVAL: EVENT_INTERVAL,
		store: ProcessorEventAutoClearMap
	});
	const b = cleanupStore({
		Now,
		INTERVAL: USER_INTERVAL,
		store: ProcessorEventUserAutoClearMap
	});
	return a && b;
};
const callback = () => {
	if (!cleanupStoreAll()) {
		setImmediate(callback);
		return;
	}
	const time = ProcessorEventAutoClearMap.size + ProcessorEventUserAutoClearMap.size > 37 ? processorRepeatedClearTimeMin : processorRepeatedClearTimeMax;
	setTimeout(callback, time).unref?.();
};
let cleanupStarted = false;
const startProcessorCleanup = () => {
	if (!cleanupStarted && !runtimeScope.getStore()) {
		cleanupStarted = true;
		setTimeout(callback, processorRepeatedClearTimeMin).unref?.();
	}
};
/**
* 消息处理器
* @param name
* @param event
* @param data
* @returns
*/
const onProcessor = (name, event, data) => {
	startProcessorCleanup();
	trackRuntimeTask(withProcessorTrace(name, event, async () => {
		try {
			event["name"] = name;
			event["IsPrivate"] = event["IsPrivate"] ?? name.startsWith("private.");
			event["IsAtMe"] = event["IsAtMe"] ?? false;
			await dispatchEventStart({
				event,
				name
			});
			const value = getConfigValue();
			const disabledTextRegular = value?.disabled_text_regular;
			if (disabledTextRegular && event["MessageText"]) {
				if (getCachedRegExp(disabledTextRegular).test(event["MessageText"])) {
					finishCurrentTrace("filtered");
					return;
				}
			}
			if ((value?.disabled_selects ?? {})[name]) {
				finishCurrentTrace("filtered");
				return;
			}
			const disabledUserId = value?.disabled_user_id;
			if (event["UserId"] && matchIn(disabledUserId, event["UserId"])) {
				finishCurrentTrace("filtered");
				return;
			}
			const disabledUserKey = value?.disabled_user_key;
			if (event["UserKey"] && matchIn(disabledUserKey, event["UserKey"])) {
				finishCurrentTrace("filtered");
				return;
			}
			const redirectRegular = value?.redirect_regular ?? value?.redirect_text_regular;
			const redirectTarget = value?.redirect_target ?? value?.redirect_text_target;
			if (redirectRegular && redirectTarget && event["MessageText"]) {
				const cachedReg = getCachedRegExp(redirectRegular);
				if (cachedReg.test(event["MessageText"])) event["MessageText"] = event["MessageText"].replace(cachedReg, redirectTarget);
			}
			const mappingText = value?.mapping_text ?? [];
			if (event["MessageText"] && typeof event["MessageText"] === "string") {
				event["MessageText"] = event["MessageText"].trim();
				for (const mapping of mappingText) {
					const { regular, target } = mapping ?? {};
					if (!regular) continue;
					const cachedReg = getCachedRegExp(regular);
					if (cachedReg.test(event["MessageText"])) event["MessageText"] = event["MessageText"].replace(cachedReg, target);
				}
			} else event["MessageText"] = "";
			const masterId = value?.master_id;
			const masterKey = value?.master_key;
			if (event["UserId"] && matchIn(masterId, event["UserId"])) event["IsMaster"] = true;
			else if (event["UserKey"] && matchIn(masterKey, event["UserKey"])) event["IsMaster"] = true;
			const botId = value?.bot_id;
			const botKey = value?.bot_key;
			if (event["UserId"] && matchIn(botId, event["UserId"])) event["IsBot"] = true;
			else if (event["UserKey"] && matchIn(botKey, event["UserKey"])) event["IsBot"] = true;
			const Now = runtimeNow();
			const EVENT_INTERVAL = value?.processor?.repeated_event_time ?? 6e4;
			if (event["MessageId"]) {
				const MessageId = fastHash(JSON.stringify([
					event.Platform,
					event.BotId,
					conversationIdentity(event),
					event["MessageId"]
				]));
				if (filter({
					Now,
					INTERVAL: EVENT_INTERVAL,
					store: ProcessorEventAutoClearMap
				}, MessageId)) {
					finishCurrentTrace("filtered");
					return;
				}
			}
			const isMessage = name === "message.create" || name === "private.message.create";
			if (isMessage) await captureMessageContext(event, value?.processor ?? {});
			const USER_INTERVAL = value?.processor?.repeated_user_time ?? 1e3;
			if (event["UserId"] && !(isMessage && value?.processor?.rateLimit?.sender)) {
				const UserId = fastHash(JSON.stringify([
					event.Platform,
					event.BotId,
					event["UserId"]
				]));
				if (filter({
					Now,
					INTERVAL: USER_INTERVAL,
					store: ProcessorEventUserAutoClearMap
				}, UserId)) {
					finishCurrentTrace("filtered");
					return;
				}
			}
			if (isMessage) {
				const decision = checkMessageRateLimit(event, value?.processor ?? {});
				if (decision.allowed === false) {
					try {
						await value?.processor?.rateLimit?.onLimit?.(event, decision);
					} catch {
						logger.warn("[rate-limit] onLimit callback failed");
					}
					finishCurrentTrace("filtered");
					return;
				}
			}
			if (data) event["value"] = data;
			if (isMessage) startMessageTyping(event, value?.processor ?? {});
			expendCycle(event, name, value);
		} catch (error) {
			finishCurrentTrace("error");
			throw error;
		}
	}));
};
/**
* 消息处理器
* @param event
* @param name
* @deprecated 该方法已被弃用，请使用 onProcessor() 替代。
* @returns
*/
const OnProcessor = (event, name) => {
	onProcessor(name, event);
};

//#endregion
export { OnProcessor, onProcessor };