import { scopedMap, scopedSet } from "../common/runtime-scope.js";

//#region src/application/expose.ts
/** 按 protocol 分组的存储: Map<protocol, Map<appName, ProviderEntry>> */
const storeExpose = scopedMap();
/** 按 protocol 存放的 watcher */
const protocolWatchers = scopedMap();
/** 全局 watcher（不指定 protocol 的） */
const globalWatchers = scopedSet();
function emitWatch(event) {
	const watchers = protocolWatchers.get(event.protocol);
	if (watchers) for (const cb of watchers) try {
		cb(event);
	} catch {}
	for (const cb of globalWatchers) try {
		cb(event);
	} catch {}
}
/**
* 插件间协议通信
*
* @example
* ```ts
* // provider 端（通过 defineChildren 的 register 返回）
* register() {
*   return {
*     expose: [
*       { name: 'help-image', description: '...', actions: { ... } }
*     ]
*   }
* }
*
* // consumer 端
* const items = Expose.list('help-image');
* items[0].invoke('read');
*
* // AI 端
* Expose.schema();
* Expose.invoke('help-image', 'plugin-a', 'read');
* ```
*/
/**
* 框架侧批量注册 expose 协议
*/
function registerExpose(appName, configs) {
	for (const config of configs) {
		const protocol = config.name;
		if (!storeExpose.has(protocol)) storeExpose.set(protocol, /* @__PURE__ */ new Map());
		const providers = storeExpose.get(protocol);
		if (providers.has(appName)) console.warn(`[expose] ${appName} already provided "${protocol}", overwriting.`);
		providers.set(appName, {
			appName,
			config
		});
	}
}
var Expose = class Expose {
	#configs = [];
	static create() {
		return new Expose();
	}
	/**
	* 注册协议 — 链式调用
	*/
	provide(config) {
		this.#configs.push(config);
		return this;
	}
	/**
	* 获取已注册的配置（框架侧使用）
	*/
	getConfigs() {
		return this.#configs;
	}
	/**
	* 列出提供者
	*/
	list(protocol) {
		const result = [];
		if (protocol) {
			const providers = storeExpose.get(protocol);
			if (!providers) return result;
			for (const [, entry] of providers) result.push(createListItem(entry, protocol));
		} else for (const [proto, providers] of storeExpose) for (const [, entry] of providers) result.push(createListItem(entry, proto));
		return result;
	}
	/**
	* 直接调用 — AI 友好
	*/
	invoke(protocol, appName, action, value) {
		const providers = storeExpose.get(protocol);
		if (!providers) throw new Error(`[expose] protocol "${protocol}" not found`);
		const entry = providers.get(appName);
		if (!entry) throw new Error(`[expose] provider "${appName}" not found in protocol "${protocol}"`);
		const actionMeta = entry.config.actions[action];
		if (!actionMeta) throw new Error(`[expose] action "${action}" not found in "${protocol}" of "${appName}"`);
		const result = actionMeta.handler(value);
		if (action !== "read") emitWatch({
			name: appName,
			protocol,
			action,
			value
		});
		return result;
	}
	/**
	* 全量元信息 — AI 发现用
	*/
	schema() {
		const result = [];
		for (const [protocol, providers] of storeExpose) {
			const firstEntry = providers.values().next().value;
			if (!firstEntry) continue;
			const actions = {};
			for (const [actionName, meta] of Object.entries(firstEntry.config.actions)) actions[actionName] = {
				description: meta.description,
				...meta.params ? { params: meta.params } : {},
				...meta.returns ? { returns: meta.returns } : {}
			};
			result.push({
				protocol,
				description: firstEntry.config.description,
				providers: Array.from(providers.keys()).map((name) => ({ name })),
				actions,
				invoke: "Expose.invoke(protocol, appName, action, value?)"
			});
		}
		return result;
	}
	/**
	* 监听变更
	*/
	watch(protocolOrCallback, callback) {
		if (typeof protocolOrCallback === "function") {
			const cb = protocolOrCallback;
			globalWatchers.add(cb);
			return () => {
				globalWatchers.delete(cb);
			};
		}
		const protocol = protocolOrCallback;
		if (!callback) throw new Error("[expose] watch(protocol, callback) requires a callback");
		if (!protocolWatchers.has(protocol)) protocolWatchers.set(protocol, /* @__PURE__ */ new Set());
		protocolWatchers.get(protocol).add(callback);
		return () => {
			const set = protocolWatchers.get(protocol);
			if (set) {
				set.delete(callback);
				if (set.size === 0) protocolWatchers.delete(protocol);
			}
		};
	}
};
function createListItem(entry, protocol) {
	const actions = {};
	for (const [actionName, meta] of Object.entries(entry.config.actions)) actions[actionName] = {
		description: meta.description,
		...meta.params ? { params: meta.params } : {},
		...meta.returns ? { returns: meta.returns } : {}
	};
	return {
		name: entry.appName,
		protocol,
		description: entry.config.description,
		actions,
		invoke(action, value) {
			const actionMeta = entry.config.actions[action];
			if (!actionMeta) throw new Error(`[expose] action "${action}" not found in "${protocol}" of "${entry.appName}"`);
			const result = actionMeta.handler(value);
			if (action !== "read") emitWatch({
				name: entry.appName,
				protocol,
				action,
				value
			});
			return result;
		}
	};
}
/**
* 清理指定插件的所有 expose 注册
* 在 ChildrenApp.un() 时调用
*/
function disposeExpose(appName) {
	for (const [protocol, providers] of storeExpose) {
		providers.delete(appName);
		if (providers.size === 0) storeExpose.delete(protocol);
	}
}
/**
* 清理全部（测试用）
*/
function clearAllExpose() {
	storeExpose.clear();
	protocolWatchers.clear();
	globalWatchers.clear();
}

//#endregion
export { Expose, clearAllExpose, disposeExpose, registerExpose };