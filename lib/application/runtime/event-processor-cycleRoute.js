import { trackRuntimeTask } from "../../common/runtime-scope.js";
import { EventMessageText } from "../../common/variable.js";
import { getCachedRegExp, showErrorModule } from "../../common/utils.js";
import "../../common/index.js";
import { dispatchEventError } from "./event-error.js";

//#region src/application/runtime/event-processor-cycleRoute.ts
const AsyncFunction = (async () => {}).constructor;
function isAsyncFunction(fn) {
	return fn instanceof AsyncFunction;
}
function isFunction(value) {
	return isAsyncFunction(value) || typeof value === "function" || value instanceof Function;
}
/**
* 创建路由处理调用函数
* @param valueEvent
* @param select
* @param nextCycle
* @param callHandler
* @returns
*/
const createRouteProcessChildren = (valueEvent, select, nextCycle, callHandler, phase) => {
	const handlerResultCache = /* @__PURE__ */ new Map();
	/** 从链表尾部回溯收集所有 handler（返回按根→叶顺序） */
	const collectHandlers = (tail) => {
		const result = [];
		let node = tail;
		while (node) {
			result.push(node.handler);
			node = node.prev;
		}
		result.reverse();
		return result;
	};
	/**
	* 执行 handler 并缓存结果，已缓存则直接返回
	*/
	const resolveHandler = async (handler) => {
		if (handlerResultCache.has(handler)) return handlerResultCache.get(handler);
		const app = await handler();
		const result = {
			matched: true,
			currents: []
		};
		if (isFunction(app)) result.currents.push(app);
		else if (!(Array.isArray(app.select) ? app.select : [app.select]).includes(select)) result.matched = false;
		else {
			const items = Array.isArray(app.current) ? app.current : [app.current];
			result.currents.push(...items);
		}
		handlerResultCache.set(handler, result);
		return result;
	};
	const processChildren = (nodes, pendingTail, next) => {
		if (!nodes || nodes.length === 0) {
			trackRuntimeTask(next());
			return;
		}
		let idx = 0;
		const nextNode = async () => {
			idx++;
			if (idx > nodes.length) {
				trackRuntimeTask(next());
				return;
			}
			const node = nodes[idx - 1];
			if (node.platform) {
				if (Array.isArray(node?.platform)) {
					if (!node?.platform.includes(valueEvent.Platform)) {
						trackRuntimeTask(nextNode());
						return;
					}
				}
				if (node.platform !== valueEvent.Platform) {
					trackRuntimeTask(nextNode());
					return;
				}
			}
			if (node?.selects) {
				if (!(Array.isArray(node.selects) ? node.selects : [node.selects]).includes(select)) {
					trackRuntimeTask(nextNode());
					return;
				}
			}
			if (EventMessageText.includes(select)) {
				const text = valueEvent["MessageText"] ?? "";
				if (node.exact !== void 0) {
					if (text !== node.exact) {
						trackRuntimeTask(nextNode());
						return;
					}
				}
				if (node.prefix !== void 0) {
					if (!text.startsWith(node.prefix)) {
						trackRuntimeTask(nextNode());
						return;
					}
				}
				if (node.regular) {
					if (!getCachedRegExp(node.regular).test(text)) {
						trackRuntimeTask(nextNode());
						return;
					}
				}
			}
			if (!node.handler) {
				trackRuntimeTask(nextNode());
				return;
			}
			const currentNode = {
				handler: node.handler,
				prev: pendingTail
			};
			if (node.children && node.children.length > 0) {
				processChildren(node.children, currentNode, () => {
					trackRuntimeTask(nextNode());
				});
				return;
			}
			try {
				const allHandlers = collectHandlers(currentNode);
				const allCurrents = [];
				for (const h of allHandlers) {
					const result = await resolveHandler(h);
					if (!result.matched) {
						trackRuntimeTask(nextNode());
						return;
					}
					allCurrents.push(...result.currents);
				}
				callHandler(allCurrents, (cn, ...cns) => {
					if (cn) {
						nextCycle(true, ...cns);
						return;
					}
					trackRuntimeTask(nextNode());
				}, {
					appName: node.appName,
					phase
				});
			} catch (err) {
				const shouldContinue = typeof node.appName === "string" ? await dispatchEventError({
					event: valueEvent,
					error: err,
					appName: node.appName,
					phase
				}) : false;
				showErrorModule(err);
				if (shouldContinue) trackRuntimeTask(nextNode());
			}
		};
		trackRuntimeTask(nextNode());
	};
	return (nodes, _pending, next) => {
		processChildren(nodes, null, next);
	};
};

//#endregion
export { createRouteProcessChildren };