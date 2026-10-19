import { trackRuntimeTask } from "../../common/runtime-scope.js";
import { showErrorModule } from "../../common/utils.js";
import "../../common/index.js";
import { getSubscribeList } from "./store.js";
import { finishCurrentTrace, withEventContext } from "./hook-event-context.js";
import { SubscribeStatus } from "./subscribe-status.js";
import { dispatchEventError } from "./event-error.js";

//#region src/application/runtime/event-processor-subscribe.ts
/**
* 处理订阅
* @param valueEvent
* @param select
* @param next
* @param choose
*/
const expendSubscribe = (valueEvent, select, next, choose) => {
	const subListValue = getSubscribeList(choose, select);
	subListValue.resetCursor();
	/**
	* 观察者下一步
	* @returns
	*/
	const nextObserver = (cn, ...cns) => {
		if (cn) {
			next(...cns);
			return;
		}
		const item = subListValue.popNext();
		if (!item) {
			nextObserver(true);
			return;
		}
		const selects = item.data.selects;
		const ID = item.data.id;
		if (item.data.status === SubscribeStatus.paused) {
			subListValue.removeCurrent();
			nextObserver();
			return;
		}
		for (const key in item.data.keys) if (item.data.keys[key] !== valueEvent[key]) {
			nextObserver();
			return;
		}
		const onActive = () => {
			for (const select of selects) getSubscribeList(choose, select).forEach((node) => {
				if (node.data.id === ID) {
					node.data.status = SubscribeStatus.active;
					return true;
				}
			});
		};
		const onPaused = () => {
			for (const select of selects) getSubscribeList(choose, select).forEach((node) => {
				if (node.data.id === ID) {
					node.data.status = SubscribeStatus.paused;
					return true;
				}
			});
		};
		onPaused();
		let isContinue = false;
		const Continue = (cn, ...cns) => {
			onActive();
			if (cn) {
				isContinue = true;
				nextObserver(...cns);
			}
		};
		try {
			const result = withEventContext(valueEvent, Continue, () => item.data.current(valueEvent, Continue), {
				appName: item.data.appName,
				phase: "subscribe"
			});
			if (result && typeof result.then === "function") {
				trackRuntimeTask(Promise.resolve(result).then(() => {
					if (!isContinue) finishCurrentTrace("consumed");
				}, async (error) => {
					finishCurrentTrace("error");
					const shouldContinue = typeof item.data.appName === "string" ? await dispatchEventError({
						event: valueEvent,
						error,
						appName: item.data.appName,
						phase: "subscribe"
					}) : false;
					showErrorModule(error);
					if (shouldContinue) nextObserver(true);
				}));
				return;
			}
			if (!isContinue) finishCurrentTrace("consumed");
		} catch (error) {
			finishCurrentTrace("error");
			trackRuntimeTask((async () => {
				const shouldContinue = typeof item.data.appName === "string" ? await dispatchEventError({
					event: valueEvent,
					error,
					appName: item.data.appName,
					phase: "subscribe"
				}) : false;
				showErrorModule(error);
				if (shouldContinue) nextObserver(true);
			})());
		}
	};
	nextObserver();
};
/**
*
* @param valueEvent
* @param select
* @param next
*/
const expendSubscribeCreate = (valueEvent, select, next) => {
	expendSubscribe(valueEvent, select, next, "create");
};
/**
*
* @param valueEvent
* @param select
* @param next
*/
const expendSubscribeMount = (valueEvent, select, next) => {
	expendSubscribe(valueEvent, select, next, "mount");
};
/**
*
* @param valueEvent
* @param select
* @param next
*/
const expendSubscribeUnmount = (valueEvent, select, next) => {
	expendSubscribe(valueEvent, select, next, "unmount");
};

//#endregion
export { expendSubscribe, expendSubscribeCreate, expendSubscribeMount, expendSubscribeUnmount };