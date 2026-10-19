import { logger } from "./logger.js";
import { runtimeScope, scopedResource } from "./runtime-scope.js";
import { ResultCode } from "./variable.js";
import { existsSync, mkdirSync, readFileSync, watch, writeFileSync } from "fs";
import { dirname, isAbsolute, join } from "path";
import YAML from "yaml";

//#region src/common/config.ts
var ConfigCore = class {
	#value = null;
	#mergedValue = null;
	#watcher = null;
	#listeners = /* @__PURE__ */ new Set();
	#debounceTimer = null;
	#debounceDelay = 100;
	#argvProxy = null;
	#resolvedDir = null;
	#initValue = {};
	#package = null;
	constructor(dir, memoryValue) {
		this.#resolvedDir = memoryValue ? null : isAbsolute(dir) ? dir : join(process.cwd(), dir);
		this.#value = memoryValue ?? null;
	}
	#invalidateMergedCache() {
		this.#mergedValue = null;
	}
	#readConfig() {
		if (!this.#resolvedDir) return null;
		try {
			const data = readFileSync(this.#resolvedDir, "utf-8");
			return YAML.parse(data);
		} catch (err) {
			logger.error({
				code: ResultCode.FailInternal,
				message: "Config file parse error",
				data: err
			});
			return null;
		}
	}
	#applyValue(newValue) {
		if (newValue === null) return;
		this.#value = newValue;
		this.#invalidateMergedCache();
	}
	#notifyListeners() {
		if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
		this.#debounceTimer = setTimeout(() => {
			this.#debounceTimer = null;
			const val = this.value;
			if (!val) return;
			for (const listener of this.#listeners) try {
				listener(val);
			} catch (err) {
				logger.error({
					code: ResultCode.FailInternal,
					message: "Config listener error",
					data: err
				});
			}
		}, this.#debounceDelay);
	}
	#ensureWatcher() {
		if (this.#watcher || !this.#resolvedDir) return;
		if (!existsSync(this.#resolvedDir)) return;
		this.#watcher = watch(this.#resolvedDir, () => {
			const newValue = this.#readConfig();
			if (newValue !== null) {
				this.#applyValue(newValue);
				this.#notifyListeners();
			}
		});
	}
	#init() {
		if (!this.#resolvedDir) return;
		if (!existsSync(this.#resolvedDir)) {
			this.saveValue(this.#initValue);
			return;
		}
		this.#applyValue(this.#readConfig());
		this.#ensureWatcher();
	}
	get value() {
		if (!this.#value) this.#init();
		if (this.#mergedValue) return this.#mergedValue;
		this.#mergedValue = {
			...this.#value || {},
			...runtimeScope.getStore() ? {} : global?.__options || {}
		};
		return this.#mergedValue;
	}
	/**
	* 配置文件绝对路径（供外部做保注释的直接文件读写）
	*/
	get path() {
		return this.#resolvedDir;
	}
	/**
	* 重新读取配置文件并应用。
	* 外部绕过 saveValue 直接改写文件（如保留注释的增量写入）后调用，同步内存值
	*/
	reload() {
		if (!this.#resolvedDir || !existsSync(this.#resolvedDir)) return;
		this.#applyValue(this.#readConfig());
		this.#ensureWatcher();
	}
	saveValue(value) {
		if (!this.#resolvedDir) {
			this.#applyValue(value);
			return;
		}
		const dirPath = dirname(this.#resolvedDir);
		if (!existsSync(this.#resolvedDir)) mkdirSync(dirPath, { recursive: true });
		const data = YAML.stringify(value);
		writeFileSync(this.#resolvedDir, data, "utf-8");
		this.#applyValue(value);
		this.#ensureWatcher();
	}
	onWatch(listener) {
		this.#listeners.add(listener);
		if (!this.#value) this.#init();
		else this.#ensureWatcher();
		return () => {
			this.#listeners.delete(listener);
		};
	}
	dispose() {
		if (this.#watcher) {
			this.#watcher.close();
			this.#watcher = null;
		}
		if (this.#debounceTimer) {
			clearTimeout(this.#debounceTimer);
			this.#debounceTimer = null;
		}
		this.#listeners.clear();
	}
	get package() {
		if (this.#package) return this.#package;
		const dir = process.env.PKG_PATH || join(process.cwd(), "package.json");
		if (!existsSync(dir)) {
			logger.warn({
				code: ResultCode.FailInternal,
				message: "package.json not found",
				data: null
			});
			return null;
		}
		try {
			const data = readFileSync(dir, "utf-8");
			this.#package = JSON.parse(data);
		} catch (err) {
			logger.error({
				code: ResultCode.FailInternal,
				message: "package.json parse error",
				data: err
			});
			return null;
		}
		return this.#package;
	}
	get argv() {
		if (this.#argvProxy) return this.#argvProxy;
		this.#argvProxy = new Proxy({}, { get(_target, key) {
			if (typeof key === "symbol") return;
			const index0 = process.argv.indexOf(key);
			if (index0 !== -1) return process.argv[index0 + 1];
			const index = process.argv.indexOf(`--${key}`);
			if (index !== -1) return process.argv[index + 1];
			return null;
		} });
		return this.#argvProxy;
	}
};
const configScopeKey = Symbol("config");
const getConfig = () => {
	if (runtimeScope.getStore()) return scopedResource(configScopeKey, () => new ConfigCore("", {}), void 0);
	if (global?.__config) return global.__config;
	const configDir = process.env.CFG_PATH || "alemon.config.yaml";
	global.__config = new ConfigCore(configDir);
	return global.__config;
};
const getConfigValue = () => {
	return getConfig()?.value || {};
};
const onWatchConfigValue = (callback) => {
	return getConfig().onWatch(callback);
};

//#endregion
export { getConfig, getConfigValue, onWatchConfigValue };