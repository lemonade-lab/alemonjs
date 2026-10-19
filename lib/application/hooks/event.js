import { getCurrentNext } from "../runtime/hook-event-context.js";
import { getEventOrThrow } from "./common.js";

//#region src/application/hooks/event.ts
const isOptions = (v) => {
	return typeof v === "object" && "selects" in v;
};
/**
* @param event
* @param options
* @returns
*/
function useEvent(eventOrOptions, options) {
	let eventArg;
	let opts;
	if (eventOrOptions && isOptions(eventOrOptions)) opts = eventOrOptions;
	else {
		eventArg = eventOrOptions;
		opts = options;
	}
	const { selects, regular, prefix, exact } = opts ?? {};
	const eventValue = getEventOrThrow(eventArg);
	const { name, MessageText } = eventValue;
	const match = {
		selects: (Array.isArray(selects) ? selects : [selects]).includes(name),
		exact: !!(exact && MessageText === exact),
		prefix: !!(prefix && MessageText?.startsWith(prefix)),
		regular: !!(regular && MessageText && regular.test(MessageText))
	};
	const r = {
		current: { ...eventValue },
		match
	};
	Object.defineProperty(r, "value", { get() {
		return eventValue.value;
	} });
	return [r, getCurrentNext() ?? (() => {})];
}
/**
* 创建event
* @deprecated 该函数不建议直接使用，推荐使用useEvent
* @param options
* @returns
*/
function createEvent(options) {
	const { event, selects, regular, prefix, exact } = options;
	const [eventRef] = useEvent(event, {
		selects,
		regular,
		prefix,
		exact
	});
	const o = eventRef.match;
	return {
		...eventRef.current,
		...o,
		value: eventRef.value
	};
}

//#endregion
export { createEvent, useEvent };