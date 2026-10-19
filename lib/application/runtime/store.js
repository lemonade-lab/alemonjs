import { Logger, logger, shutdownLogger } from "../../common/logger.js";
import { runtimeScope, scopedMap, scopedResource } from "../../common/runtime-scope.js";
import { SinglyLinkedList } from "../../common/SinglyLinkedList.js";
import { disposeExpose } from "../expose.js";
import { dispatchRuntimeStatusChange } from "./lifecycle-callbacks.js";
import { clearActiveContextsByApp } from "./context-registry.js";

//#region src/application/runtime/store.ts
/**
* 全部挂在全局变量上，
* 要求一个nodejs中，
* 出现不同位置的模块也读取同一个数据
* @description 存储器
*/
const createCore = () => ({
	storeState: {},
	storeStateSubscribe: {},
	storeSubscribeList: {
		create: /* @__PURE__ */ new Map(),
		mount: /* @__PURE__ */ new Map(),
		unmount: /* @__PURE__ */ new Map()
	},
	storeChildrenApp: {},
	runtimeApps: {},
	runtimeAppKoaRouters: {}
});
const coreScopeKey = Symbol("core");
const getRuntimeCore = () => {
	if (runtimeScope.getStore()) return scopedResource(coreScopeKey, createCore, void 0);
	return global.alemonjsCore ??= createCore();
};
var Core = class {
	constructor() {
		getRuntimeCore();
	}
	get value() {
		return getRuntimeCore();
	}
};
let _storeVersion = 0;
const createEmptyRuntimeCapabilities = () => ({
	event: false,
	httpApi: false,
	web: false,
	schedule: false,
	expose: false
});
const logRuntimeAppStatus = (level, record) => {
	if (!global.logger?.[level]) return;
	global.logger[level]({
		message: "runtime app status",
		data: {
			app: record.name,
			kind: record.kind,
			status: record.status,
			capabilities: record.capabilities,
			error: record.error?.message ?? null
		}
	});
};
const normalizeRuntimeAppError = (error) => {
	if (!error) return;
	if (error instanceof Error) return {
		message: error.message,
		stack: error.stack,
		time: Date.now()
	};
	return {
		message: typeof error === "string" ? error : "Unknown runtime app error",
		time: Date.now()
	};
};
const sameRuntimeAppCapabilities = (left, right) => {
	return left.event === right.event && left.httpApi === right.httpApi && left.web === right.web && left.schedule === right.schedule && left.expose === right.expose;
};
const sameRuntimeAppError = (left, right) => {
	if (!left && !right) return true;
	if (!left || !right) return false;
	return left.message === right.message && left.stack === right.stack;
};
const getRuntimeAppStore = () => {
	if (!getRuntimeCore().runtimeApps) getRuntimeCore().runtimeApps = {};
	return getRuntimeCore().runtimeApps;
};
const getRuntimeAppKoaRouterStore = () => {
	if (!getRuntimeCore().runtimeAppKoaRouters) getRuntimeCore().runtimeAppKoaRouters = {};
	return getRuntimeCore().runtimeAppKoaRouters;
};
const registerRuntimeApp = (record) => {
	const runtimeApps = getRuntimeAppStore();
	const current = runtimeApps[record.name];
	const now = Date.now();
	const nextCapabilities = {
		...current?.capabilities ?? createEmptyRuntimeCapabilities(),
		...record.capabilities ?? {}
	};
	runtimeApps[record.name] = {
		name: record.name,
		kind: record.kind,
		enabled: record.enabled,
		status: record.status,
		rootDir: record.rootDir,
		mainPath: record.mainPath,
		error: record.error,
		capabilities: nextCapabilities,
		createdAt: current?.createdAt ?? now,
		updatedAt: now
	};
	if (current?.status !== record.status && process.env.NODE_ENV === "development") logRuntimeAppStatus("debug", runtimeApps[record.name]);
	return runtimeApps[record.name];
};
const updateRuntimeAppStatus = (name, status, error) => {
	const current = getRuntimeAppStore()[name];
	if (!current) return;
	const normalizedError = normalizeRuntimeAppError(error);
	const previousStatus = current.status;
	if (current.status === status && sameRuntimeAppError(current.error, normalizedError)) return current;
	current.status = status;
	current.updatedAt = Date.now();
	current.error = normalizedError;
	logRuntimeAppStatus(status === "failed" ? "warn" : status === "disposed" ? "info" : "debug", current);
	dispatchRuntimeStatusChange({
		appName: name,
		previousStatus,
		status,
		error: normalizedError ? {
			message: normalizedError.message,
			time: normalizedError.time
		} : void 0
	});
	return current;
};
const updateRuntimeAppCapabilities = (name, capabilities) => {
	const current = getRuntimeAppStore()[name];
	if (!current) return;
	const nextCapabilities = {
		...current.capabilities,
		...capabilities
	};
	if (sameRuntimeAppCapabilities(current.capabilities, nextCapabilities)) return current;
	current.capabilities = nextCapabilities;
	current.updatedAt = Date.now();
	return current;
};
const setRuntimeAppKoaRouters = (name, koaRouters) => {
	const koaRouterStore = getRuntimeAppKoaRouterStore();
	if (!koaRouters) {
		Reflect.deleteProperty(koaRouterStore, name);
		return [];
	}
	const normalizedRouters = (Array.isArray(koaRouters) ? koaRouters : [koaRouters]).filter(Boolean);
	koaRouterStore[name] = normalizedRouters;
	return normalizedRouters;
};
const getRuntimeAppKoaRouters = (name) => {
	return getRuntimeAppKoaRouterStore()[name] ?? [];
};
const clearRuntimeAppKoaRouters = (name) => {
	const koaRouterStore = getRuntimeAppKoaRouterStore();
	Reflect.deleteProperty(koaRouterStore, name);
};
const listRuntimeAppKoaRouters = () => {
	return Object.entries(getRuntimeAppKoaRouterStore()).sort(([left], [right]) => {
		if (left === "main" && right !== "main") return -1;
		if (left !== "main" && right === "main") return 1;
		return left.localeCompare(right);
	}).map(([name, routers]) => ({
		name,
		routers: [...routers]
	}));
};
const getRuntimeApp = (name) => {
	return getRuntimeAppStore()[name];
};
const toRuntimeAppSnapshot = (item) => ({
	...item,
	capabilities: { ...item.capabilities },
	error: item.error ? {
		message: item.error.message,
		time: item.error.time
	} : void 0
});
const listRuntimeApps = () => {
	return Object.values(getRuntimeAppStore()).sort((left, right) => {
		if (left.name === "main" && right.name !== "main") return -1;
		if (left.name !== "main" && right.name === "main") return 1;
		return left.name.localeCompare(right.name);
	}).map(toRuntimeAppSnapshot);
};
const disposeRuntimeApp = (name) => {
	clearRuntimeAppKoaRouters(name);
	return updateRuntimeAppStatus(name, "disposed");
};
const disposeAllRuntimeApps = () => {
	const runtimeApps = listRuntimeApps();
	runtimeApps.forEach((app) => {
		disposeRuntimeApp(app.name);
	});
	return runtimeApps;
};
const hasRuntimeAppCapability = (name, capability) => {
	return Boolean(getRuntimeApp(name)?.capabilities?.[capability]);
};
const bumpStoreVersion = () => {
	_storeVersion++;
};
var Response = class {
	#cache = null;
	#cacheVersion = -1;
	get value() {
		if (!runtimeScope.getStore() && this.#cacheVersion === _storeVersion && this.#cache !== null) return this.#cache;
		const data = Object.keys(getRuntimeCore().storeChildrenApp).map((key) => {
			return getRuntimeCore().storeChildrenApp[key].response;
		});
		this.#cache = data.flat();
		this.#cacheVersion = runtimeScope.getStore() ? -1 : _storeVersion;
		return this.#cache;
	}
};
/**
* @deprecated 已被 ResponseTree 替代，保留仅为兼容
*/
var ResponseMiddleware = class {
	find(name, stateKey) {
		if (typeof name !== "string" || typeof stateKey !== "string") return [];
		if (!getRuntimeCore().storeChildrenApp[name]) return [];
		const app = getRuntimeCore().storeChildrenApp[name];
		if (!app.middlewareResponse) return [];
		const state = stateKey.split(":");
		const mr = [];
		while (state.length > 1) {
			const key = state.join(":");
			if (app.middlewareResponse[key]) mr.push(app.middlewareResponse[key]);
			state.pop();
		}
		return mr;
	}
};
function createTreeNode() {
	return {
		files: [],
		children: /* @__PURE__ */ new Map()
	};
}
/**
* 将扁平的 response 数组 + middlewareResponse 字典按 stateKey 层级组装为树
*/
function buildFileTree(files, middlewareResponse) {
	const root = createTreeNode();
	for (const file of files) {
		if (!file.stateKey) {
			root.files.push(file);
			continue;
		}
		const parts = file.stateKey.split(":");
		let node = root;
		for (const part of parts) {
			if (!node.children.has(part)) node.children.set(part, createTreeNode());
			node = node.children.get(part);
		}
		node.files.push(file);
	}
	if (middlewareResponse) for (const [key, mw] of Object.entries(middlewareResponse)) {
		const parts = key.split(":");
		let node = root;
		for (const part of parts) {
			if (!node.children.has(part)) node.children.set(part, createTreeNode());
			node = node.children.get(part);
		}
		node.middleware = mw;
	}
	return root;
}
/**
* 合并两棵文件树
*/
function mergeFileTree(target, source) {
	target.files.push(...source.files);
	if (source.middleware) {
		if (!target.middleware) target.middleware = source.middleware;
		else console.warn(`[mergeFileTree] middleware conflict at same stateKey, keeping first (${target.middleware.path}), discarding (${source.middleware.path})`);
	}
	for (const [key, child] of source.children) if (target.children.has(key)) mergeFileTree(target.children.get(key), child);
	else target.children.set(key, child);
}
const attachRouteAppName = (appName, routes = []) => {
	return routes.map((route) => ({
		...route,
		appName,
		children: route.children ? attachRouteAppName(appName, route.children) : route.children
	}));
};
/**
* 中间件文件树 — 替代扁平 Middleware 数组
* 复用 buildFileTree / mergeFileTree，无 middlewareResponse（中间件无嵌套中间件概念）
*/
var MiddlewareTree = class {
	#cache = null;
	#cacheVersion = -1;
	get value() {
		if (!runtimeScope.getStore() && this.#cacheVersion === _storeVersion && this.#cache !== null) return this.#cache;
		const root = createTreeNode();
		for (const appKey of Object.keys(getRuntimeCore().storeChildrenApp)) {
			const app = getRuntimeCore().storeChildrenApp[appKey];
			mergeFileTree(root, buildFileTree(app.middleware ?? [], void 0));
		}
		this.#cache = root;
		this.#cacheVersion = runtimeScope.getStore() ? -1 : _storeVersion;
		return this.#cache;
	}
};
/**
* 文件响应体树 — 替代扁平 Response + ResponseMiddleware 的组合
*/
var ResponseTree = class {
	#cache = null;
	#cacheVersion = -1;
	get value() {
		if (!runtimeScope.getStore() && this.#cacheVersion === _storeVersion && this.#cache !== null) return this.#cache;
		const root = createTreeNode();
		for (const appKey of Object.keys(getRuntimeCore().storeChildrenApp)) {
			const app = getRuntimeCore().storeChildrenApp[appKey];
			mergeFileTree(root, buildFileTree(app.response ?? [], app.middlewareResponse));
		}
		this.#cache = root;
		this.#cacheVersion = runtimeScope.getStore() ? -1 : _storeVersion;
		return this.#cache;
	}
};
var ResponseRouter = class {
	#cache = null;
	#cacheVersion = -1;
	get value() {
		if (!runtimeScope.getStore() && this.#cacheVersion === _storeVersion && this.#cache !== null) return this.#cache;
		const data = Object.keys(getRuntimeCore().storeChildrenApp).map((key) => {
			if (!getRuntimeCore().storeChildrenApp[key].register) return [];
			if (getRuntimeCore().storeChildrenApp[key].register?.responseRouter) return attachRouteAppName(key, getRuntimeCore().storeChildrenApp[key].register?.responseRouter?.current ?? []);
			if (getRuntimeCore().storeChildrenApp[key].register?.response) return attachRouteAppName(key, getRuntimeCore().storeChildrenApp[key].register?.response?.current ?? []);
			return [];
		});
		this.#cache = data.flat();
		this.#cacheVersion = runtimeScope.getStore() ? -1 : _storeVersion;
		return this.#cache;
	}
};
var MiddlewareRouter = class {
	#cache = null;
	#cacheVersion = -1;
	get value() {
		if (!runtimeScope.getStore() && this.#cacheVersion === _storeVersion && this.#cache !== null) return this.#cache;
		const data = Object.keys(getRuntimeCore().storeChildrenApp).map((key) => {
			if (!getRuntimeCore().storeChildrenApp[key].register) return [];
			if (getRuntimeCore().storeChildrenApp[key].register?.middlewareRouter) return attachRouteAppName(key, getRuntimeCore().storeChildrenApp[key].register?.middlewareRouter?.current ?? []);
			if (getRuntimeCore().storeChildrenApp[key].register?.middleware) return attachRouteAppName(key, getRuntimeCore().storeChildrenApp[key].register?.middleware?.current ?? []);
			return [];
		});
		this.#cache = data.flat();
		this.#cacheVersion = runtimeScope.getStore() ? -1 : _storeVersion;
		return this.#cache;
	}
};
var Middleware = class {
	#cache = null;
	#cacheVersion = -1;
	get value() {
		if (!runtimeScope.getStore() && this.#cacheVersion === _storeVersion && this.#cache !== null) return this.#cache;
		const data = Object.keys(getRuntimeCore().storeChildrenApp).map((key) => {
			return getRuntimeCore().storeChildrenApp[key].middleware;
		});
		this.#cache = data.flat();
		this.#cacheVersion = runtimeScope.getStore() ? -1 : _storeVersion;
		return this.#cache;
	}
};
var SubscribeList = class {
	#select;
	#choice;
	constructor(choice, select) {
		this.#select = select;
		this.#choice = choice;
		if (!getRuntimeCore().storeSubscribeList[this.#choice].has(this.#select)) getRuntimeCore().storeSubscribeList[this.#choice].set(this.#select, new SinglyLinkedList());
	}
	get value() {
		return getRuntimeCore().storeSubscribeList[this.#choice].get(this.#select);
	}
};
/**
* 纯函数版 SubscribeList 访问 — 避免每次创建类实例的 GC 开销
*/
const getSubscribeList = (choice, select) => {
	if (!getRuntimeCore().storeSubscribeList[choice].has(select)) getRuntimeCore().storeSubscribeList[choice].set(select, new SinglyLinkedList());
	return getRuntimeCore().storeSubscribeList[choice].get(select);
};
var StateSubscribe = class {
	#name = null;
	constructor(name) {
		this.#name = name;
		if (!getRuntimeCore().storeStateSubscribe[name]) getRuntimeCore().storeStateSubscribe[name] = [];
	}
	on(callback) {
		getRuntimeCore().storeStateSubscribe[this.#name].push(callback);
	}
	un(callback) {
		getRuntimeCore().storeStateSubscribe[this.#name] = getRuntimeCore().storeStateSubscribe[this.#name].filter((cb) => cb !== callback);
	}
	get value() {
		return getRuntimeCore().storeStateSubscribe[this.#name];
	}
};
/**
* @deprecated 废弃。指令管理可直接配置禁用正则
*/
var StateProxy = class {
	create(value = {}) {
		return new Proxy(value, {
			get(target, prop) {
				return prop in target ? target[prop] : false;
			},
			set(target, prop, value) {
				target[prop] = value;
				if (getRuntimeCore().storeStateSubscribe[prop]) for (const callback of getRuntimeCore().storeStateSubscribe[prop]) callback(value);
				return true;
			}
		});
	}
};
/**
* @deprecated 废弃。指令管理可直接配置禁用正则
*/
var State = class {
	#name = null;
	/**
	*
	* @param name
	* @param defaultValue 默认，允许匹配
	*/
	constructor(name, defaultValue = true) {
		this.#name = name;
		if (!getRuntimeCore().storeState) getRuntimeCore().storeState = new StateProxy().create();
		if (!(name in getRuntimeCore().storeState)) getRuntimeCore().storeState[name] = defaultValue;
	}
	get value() {
		return getRuntimeCore().storeState[this.#name];
	}
	set value(value) {
		getRuntimeCore().storeState[this.#name] = value;
	}
};
var ChildrenApp = class {
	#name = null;
	#middleware = [];
	#response = [];
	#middlewareResponse = {};
	#cycle = null;
	constructor(name = "main") {
		this.#name = name;
	}
	#registerRes = {};
	register(config) {
		this.#registerRes = config;
	}
	/**
	* 推送响应体
	* @param data
	*/
	pushResponse(data) {
		this.#response = this.#response.concat(data);
	}
	/**
	* 推送响应下的中间件
	*/
	pushResponseMiddleware(data) {
		this.#middlewareResponse = {
			...this.#middlewareResponse,
			...data
		};
	}
	/**
	* 推送中间件
	* @param data
	*/
	pushMiddleware(data) {
		this.#middleware = this.#middleware.concat(data);
	}
	/**
	* 推送周期
	* @param data
	*/
	pushCycle(data) {
		this.#cycle = data;
	}
	/**
	* 挂载
	*/
	on() {
		getRuntimeCore().storeChildrenApp[this.#name] = {
			name: this.#name,
			middleware: this.#middleware,
			middlewareResponse: this.#middlewareResponse,
			response: this.#response,
			cycle: this.#cycle,
			register: this.#registerRes
		};
		bumpStoreVersion();
	}
	/**
	* 卸载
	*/
	un() {
		disposeExpose(this.#name);
		clearActiveContextsByApp(this.#name);
		Reflect.deleteProperty(getRuntimeCore().storeChildrenApp, this.#name);
		bumpStoreVersion();
	}
	/**
	* 获取
	*/
	get value() {
		if (!getRuntimeCore().storeChildrenApp[this.#name]) this.on();
		return getRuntimeCore().storeChildrenApp[this.#name];
	}
};
const getChildrenApp = (name) => {
	return getRuntimeCore().storeChildrenApp[name] ?? null;
};
const listChildrenApps = () => {
	return Object.values(getRuntimeCore().storeChildrenApp);
};
const ProcessorEventAutoClearMap = scopedMap();
const ProcessorEventUserAutoClearMap = scopedMap();
const core = new Proxy(new Core().value, {
	get(_target, property) {
		return Reflect.get(getRuntimeCore(), property);
	},
	set(_target, property, value) {
		return Reflect.set(getRuntimeCore(), property, value);
	}
});
let stopping = false;
const shutdown = async (reason) => {
	if (stopping) return;
	stopping = true;
	logger.info?.(`[alemonjs][${reason}] 收到信号，正在关闭...`);
	await shutdownLogger();
	process.exit(0);
};
[
	"SIGINT",
	"SIGTERM",
	"SIGQUIT",
	"disconnect"
].forEach((sig) => {
	process?.on?.(sig, () => void shutdown(sig));
});
process?.once?.("beforeExit", (code) => {
	logger.info?.(`[alemonjs][exit] 进程退出，code=${code}`);
	shutdownLogger();
});

//#endregion
export { ChildrenApp, Core, Logger, Middleware, MiddlewareRouter, MiddlewareTree, ProcessorEventAutoClearMap, ProcessorEventUserAutoClearMap, Response, ResponseMiddleware, ResponseRouter, ResponseTree, State, StateSubscribe, SubscribeList, bumpStoreVersion, clearRuntimeAppKoaRouters, core, disposeAllRuntimeApps, disposeRuntimeApp, getChildrenApp, getRuntimeApp, getRuntimeAppKoaRouters, getRuntimeCore, getSubscribeList, hasRuntimeAppCapability, listChildrenApps, listRuntimeAppKoaRouters, listRuntimeApps, logger, registerRuntimeApp, setRuntimeAppKoaRouters, shutdownLogger, toRuntimeAppSnapshot, updateRuntimeAppCapabilities, updateRuntimeAppStatus };