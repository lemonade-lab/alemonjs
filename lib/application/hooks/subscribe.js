import { ResultCode } from "../../common/variable.js";
import { SubscribeList } from "../runtime/store.js";
import { getCurrentAppName, getCurrentEvent } from "../runtime/hook-event-context.js";
import { SubscribeStatus } from "../runtime/subscribe-status.js";

//#region src/application/hooks/subscribe.ts
function useSubscribe(eventOrSelects, maybeSelects) {
	const selects = maybeSelects === void 0 ? eventOrSelects : maybeSelects;
	const valueEvent = (maybeSelects === void 0 ? void 0 : eventOrSelects) ?? getCurrentEvent();
	const appName = getCurrentAppName();
	if (typeof valueEvent !== "object" || valueEvent === null) {
		logger.error({
			code: ResultCode.FailParams,
			message: "event is not object",
			data: null
		});
		throw new Error("event is not object");
	}
	if (typeof selects !== "string" && !Array.isArray(selects)) {
		logger.error({
			code: ResultCode.FailParams,
			message: "select is not string or array",
			data: null
		});
		throw new Error("select is not string or array");
	}
	/**
	* 运行订阅
	* @param callback
	* @param keys
	* @param choose
	* @returns
	*/
	const register = (callback, keys, choose) => {
		const curSelects = Array.isArray(selects) ? selects : [selects];
		const ID = Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
		if (keys.length === 0) {
			logger.warn({
				code: ResultCode.FailParams,
				message: "subscribe keys is empty",
				data: null
			});
			return {
				selects: curSelects,
				choose,
				id: ID
			};
		}
		for (const select of curSelects) {
			const subList = new SubscribeList(choose, select);
			const values = {};
			for (const key of keys) if (typeof key === "string" && (typeof valueEvent[key] === "string" || typeof valueEvent[key] === "number" || typeof valueEvent[key] === "boolean")) values[key] = valueEvent[key];
			else logger.warn({
				code: ResultCode.FailParams,
				message: `Invalid key: ${key?.toString()} must be a string, number or boolean`,
				data: null
			});
			subList.value.append({
				appName,
				choose,
				selects: curSelects,
				keys: values,
				current: callback,
				status: SubscribeStatus.active,
				id: ID
			});
		}
		return {
			selects: curSelects,
			choose,
			id: ID
		};
	};
	/**
	* res 创建时 运行订阅
	* @param callback
	* @param keys
	*/
	const create = (callback, keys) => {
		return register(callback, keys, "create");
	};
	/**
	* res 挂载时 运行订阅
	* @param callback
	* @param keys
	*/
	const mountBefore = (callback, keys) => {
		return register(callback, keys, "mount");
	};
	/**
	* res 卸载时 运行订阅
	* @param callback
	* @param keys
	*/
	const unmount = (callback, keys) => {
		return register(callback, keys, "unmount");
	};
	/**
	* 清除订阅
	* @param id
	*/
	const cancel = (value) => {
		const selects = value.selects;
		const ID = value.id;
		for (const select of selects) new SubscribeList(value.choose, select).value.forEach((node) => {
			if (node.data.id === ID) {
				node.data.status = SubscribeStatus.paused;
				return true;
			}
		});
	};
	return [{
		create,
		mount: mountBefore,
		unmount,
		cancel
	}];
}
function useObserver(eventOrSelects, maybeSelects) {
	const selects = maybeSelects === void 0 ? eventOrSelects : maybeSelects;
	const event = maybeSelects === void 0 ? void 0 : eventOrSelects;
	if (selects === void 0) {
		logger.error({
			code: ResultCode.FailParams,
			message: "select is not string or array",
			data: null
		});
		throw new Error("select is not string or array");
	}
	const [subscribe] = useSubscribe(event, selects);
	return [subscribe.mount, subscribe.cancel];
}

//#endregion
export { useObserver, useSubscribe };