import { ResultCode } from "../../common/variable.js";
import { getConfigValue } from "../../common/config.js";
import "../../common/index.js";
import { forwardFromPlatform, observeFromPlatform, setPlatformChild } from "./ipc-bridge.js";
import module from "module";
import childProcess from "child_process";

//#region src/core/process/platform.ts
const initRequire = () => {};
initRequire.resolve = () => "";
const require = module?.createRequire?.(import.meta.url) ?? initRequire;
const createInitialState = () => ({
	phase: "idle",
	protocolVersion: "legacy",
	transportMode: "unknown",
	restartCount: 0,
	consecutiveFailures: 0,
	legacyReadyMode: false,
	bootTimings: {},
	lastError: null
});
let platformManager = null;
let platformState = createInitialState();
let platformProcessConfig = null;
let platformBootstrapPath = "";
let platformEntryPath = "";
const normalizeErrorMessage = (error) => {
	if (error instanceof Error) return error.message;
	return typeof error === "string" ? error : "Unknown process adapter error";
};
const isDebugEnabled = () => process.env.NODE_ENV === "development";
const debugLog = (message, data = {}) => {
	if (!isDebugEnabled()) return;
	logger.debug?.({
		message,
		data
	});
};
const clearTimer = (timer) => {
	if (timer) clearTimeout(timer);
};
const clearManagerTimers = (manager) => {
	clearTimer(manager?.controlTimer);
	clearTimer(manager?.transportTimer);
	clearTimer(manager?.appTimer);
	clearTimer(manager?.legacyTransportTimer);
	if (manager) {
		manager.controlTimer = void 0;
		manager.transportTimer = void 0;
		manager.appTimer = void 0;
		manager.legacyTransportTimer = void 0;
	}
};
const buildConfig = () => {
	const pro = getConfigValue()?.process ?? {};
	return {
		restartDelay: Number(pro?.restart_delay ?? 3e3),
		controlReadyTimeout: Number(pro?.control_ready_timeout ?? 1e4),
		transportReadyTimeout: Number(pro?.transport_ready_timeout ?? 15e3),
		appReadyTimeout: Number(pro?.app_ready_timeout ?? 3e4),
		maxRestartDelay: Number(pro?.max_restart_delay ?? 3e4),
		legacyTransportGraceMs: Number(pro?.legacy_transport_grace_ms ?? 50)
	};
};
const resetBootState = () => {
	platformState = {
		...platformState,
		phase: "booting",
		protocolVersion: "legacy",
		transportMode: "unknown",
		legacyReadyMode: false,
		startedAt: Date.now(),
		lastReadyAt: void 0,
		lastTransportReadyAt: void 0,
		lastAppReadyAt: void 0,
		bootTimings: {},
		lastError: null
	};
};
const updateTransportBinding = (transportMode) => {
	if (transportMode === "ipc" && platformManager?.child) setPlatformChild(platformManager.child);
	else setPlatformChild(null);
};
const markFailure = (error) => {
	platformState = {
		...platformState,
		phase: "failed",
		lastError: error ? normalizeErrorMessage(error) : platformState.lastError,
		consecutiveFailures: platformState.consecutiveFailures + 1
	};
};
const markTransportReady = (transport, legacyReadyMode = false) => {
	const now = Date.now();
	if (!platformManager) return;
	platformManager.transportReady = true;
	clearTimer(platformManager.transportTimer);
	clearTimer(platformManager.legacyTransportTimer);
	platformManager.transportTimer = void 0;
	platformManager.legacyTransportTimer = void 0;
	platformState = {
		...platformState,
		phase: platformState.lastAppReadyAt ? "app_ready" : "transport_ready",
		transportMode: transport,
		lastTransportReadyAt: now,
		legacyReadyMode,
		consecutiveFailures: 0,
		bootTimings: {
			...platformState.bootTimings,
			readyToTransportReadyMs: platformState.lastReadyAt ? now - platformState.lastReadyAt : void 0,
			transportReadyToAppReadyMs: platformState.lastAppReadyAt ? platformState.lastAppReadyAt - now : platformState.bootTimings.transportReadyToAppReadyMs
		}
	};
	updateTransportBinding(transport);
	if (legacyReadyMode) debugLog("platform adapter fallback to legacy transport ready");
};
const scheduleRestart = (reason) => {
	if (!platformProcessConfig || !platformBootstrapPath || !platformEntryPath) return;
	const baseDelay = platformProcessConfig.restartDelay;
	const delay = Math.min(baseDelay * 2 ** Math.max(platformState.consecutiveFailures - 1, 0), platformProcessConfig.maxRestartDelay);
	platformState = {
		...platformState,
		restartCount: platformState.restartCount + 1
	};
	debugLog("schedule platform adapter restart", {
		reason,
		delay
	});
	setTimeout(() => {
		startPlatformAdapterWithFallback();
	}, delay);
};
const cleanupManager = (manager) => {
	clearManagerTimers(manager);
	if (manager?.child) manager.child.removeAllListeners();
	setPlatformChild(null);
	if (platformManager === manager) platformManager = null;
};
const startByImport = async () => {
	try {
		const mod = await (platformEntryPath.startsWith("file://") ? import(platformEntryPath) : import(`file://${platformEntryPath}`));
		const run = typeof mod.default === "function" ? mod.default : typeof mod.main === "function" ? mod.main : null;
		if (typeof run !== "function") throw new Error("Platform entry must export a callable default or main function");
		await run();
		platformState = {
			...platformState,
			phase: "app_ready",
			protocolVersion: "legacy",
			transportMode: "import",
			consecutiveFailures: 0,
			lastTransportReadyAt: Date.now(),
			lastAppReadyAt: Date.now()
		};
		debugLog("platform adapter started via import fallback");
	} catch (error) {
		logger?.error?.({
			code: ResultCode.Fail,
			message: "import 启动平台连接失败",
			data: error
		});
		markFailure(error);
		scheduleRestart("import_fallback_failed");
	}
};
const handleControlReady = (manager, message) => {
	const protocolVersion = message.protocolVersion === "v2" ? "v2" : "legacy";
	const now = Date.now();
	manager.protocolVersion = protocolVersion;
	clearTimer(manager.controlTimer);
	manager.controlTimer = void 0;
	platformState = {
		...platformState,
		phase: "control_ready",
		protocolVersion,
		legacyReadyMode: protocolVersion === "legacy",
		lastReadyAt: now,
		bootTimings: {
			...platformState.bootTimings,
			forkToReadyMs: platformState.startedAt ? now - platformState.startedAt : void 0
		}
	};
	manager.child?.send?.({ type: "start" });
	if (protocolVersion === "v2") {
		manager.transportTimer = setTimeout(() => {
			logger?.warn?.({
				code: ResultCode.Fail,
				message: "平台连接进程未在规定时间内建立通讯层，准备降级/重启",
				data: null
			});
			manager.isKilling = true;
			manager.fallbackToImportOnExit = Boolean(process.env.port);
			markFailure("transport_ready_timeout");
			try {
				manager.child?.kill();
			} catch {
				cleanupManager(manager);
				if (manager.fallbackToImportOnExit) startByImport();
				else scheduleRestart("transport_ready_timeout");
			}
		}, platformProcessConfig?.transportReadyTimeout ?? 15e3);
		manager.appTimer = setTimeout(() => {
			logger?.warn?.({
				code: ResultCode.Warn,
				message: "平台连接进程业务初始化较慢，尚未收到 app_ready",
				data: null
			});
		}, platformProcessConfig?.appReadyTimeout ?? 3e4);
	} else {
		const legacyTransportMode = process.env.__ALEMON_DIRECT_SOCK ? "direct" : "ipc";
		manager.legacyTransportTimer = setTimeout(() => {
			if (!manager.transportReady) markTransportReady(legacyTransportMode, true);
		}, platformProcessConfig?.legacyTransportGraceMs ?? 50);
	}
};
const handleMessage = (manager, message) => {
	const data = typeof message === "string" ? JSON.parse(message) : message;
	if (data?.type === "ready") {
		handleControlReady(manager, data);
		return;
	}
	if (data?.type === "transport_ready") {
		markTransportReady(data.transport ?? "unknown");
		return;
	}
	if (data?.type === "app_ready") {
		const now = Date.now();
		manager.appReady = true;
		clearTimer(manager.appTimer);
		manager.appTimer = void 0;
		platformState = {
			...platformState,
			phase: "app_ready",
			lastAppReadyAt: now,
			bootTimings: {
				...platformState.bootTimings,
				transportReadyToAppReadyMs: platformState.lastTransportReadyAt ? now - platformState.lastTransportReadyAt : platformState.bootTimings.transportReadyToAppReadyMs
			}
		};
		return;
	}
	if (data?.type === "boot_error") {
		platformState = {
			...platformState,
			lastError: normalizeErrorMessage(data.error?.message ?? data.error)
		};
		logger?.warn?.({
			code: ResultCode.Fail,
			message: `平台连接进程启动阶段失败: ${String(data.stage ?? "unknown")}`,
			data: data.error ?? null
		});
		return;
	}
	if (data?.type === "ipc:data") {
		forwardFromPlatform(data.data);
		return;
	}
	if (data?.type === "cbp.event") observeFromPlatform(data.data);
};
const getPlatformAdapterState = () => ({
	...platformState,
	bootTimings: { ...platformState.bootTimings }
});
function restartPlatformAdapter() {
	if (!platformManager?.child) {
		startPlatformAdapterWithFallback();
		return;
	}
	if (platformManager.restartRequested) return;
	platformManager.restartRequested = true;
	platformManager.isKilling = true;
	platformState = {
		...platformState,
		phase: "stopping"
	};
	clearManagerTimers(platformManager);
	try {
		platformManager.child.kill();
	} catch {
		cleanupManager(platformManager);
		scheduleRestart("manual_restart");
	}
}
function startPlatformAdapterWithFallback() {
	platformProcessConfig = buildConfig();
	const platformPath = process.env.platform;
	if (!platformPath) {
		logger?.error?.({
			code: ResultCode.Fail,
			message: "未配置平台连接路径",
			data: null
		});
		platformState = {
			...platformState,
			phase: "failed",
			lastError: "missing platform path"
		};
		return Promise.resolve();
	}
	try {
		platformEntryPath = require.resolve(platformPath);
		platformBootstrapPath = require.resolve("../../platform-bootstrap.js");
	} catch (error) {
		logger?.warn?.({
			code: ResultCode.Fail,
			message: "平台连接包未支持 require",
			data: error
		});
		markFailure(error);
		return Promise.resolve();
	}
	if (platformManager?.child && platformManager.child.exitCode === null && !platformManager.child.killed) return Promise.resolve();
	resetBootState();
	const manager = {
		isKilling: false,
		restartRequested: false,
		transportReady: false,
		appReady: false,
		protocolVersion: "legacy",
		fallbackToImportOnExit: false
	};
	platformManager = manager;
	manager.controlTimer = setTimeout(() => {
		logger?.error?.({
			code: ResultCode.Fail,
			message: "平台连接进程未及时发送 ready，正在重启",
			data: null
		});
		manager.isKilling = true;
		markFailure("control_ready_timeout");
		try {
			manager.child?.kill();
		} catch {
			cleanupManager(manager);
			scheduleRestart("control_ready_timeout");
		}
	}, platformProcessConfig.controlReadyTimeout);
	try {
		manager.child = childProcess.fork(platformBootstrapPath, [], {
			execArgv: process.execArgv,
			env: {
				...process.env,
				__ALEMON_IPC: "1",
				__ALEMON_PLATFORM_ENTRY: platformEntryPath
			},
			serialization: "advanced"
		});
		manager.child.on("exit", (code, signal) => {
			const fallbackToImportOnExit = manager.fallbackToImportOnExit;
			cleanupManager(manager);
			if (fallbackToImportOnExit) {
				startByImport();
				return;
			}
			if (manager.isKilling || manager.restartRequested) {
				scheduleRestart(manager.restartRequested ? "manual_restart" : "timeout_or_kill");
				return;
			}
			logger?.warn?.({
				code: ResultCode.Fail,
				message: `平台连接子进程已退出，code=${code}, signal=${signal}，稍后自动重启`,
				data: null
			});
			markFailure(`exit:${code ?? "null"}:${signal ?? "null"}`);
			scheduleRestart("unexpected_exit");
		});
		manager.child.on("message", (message) => {
			try {
				handleMessage(manager, message);
			} catch (error) {
				logger?.error?.({
					code: ResultCode.Fail,
					message: "平台连接进程通信数据格式错误",
					data: error
				});
			}
		});
		manager.child.on("error", (error) => {
			logger?.error?.({
				code: ResultCode.Fail,
				message: "平台连接子进程发生错误",
				data: error
			});
			platformState = {
				...platformState,
				lastError: normalizeErrorMessage(error)
			};
		});
	} catch (error) {
		cleanupManager(manager);
		logger?.warn?.({
			code: ResultCode.Fail,
			message: "fork 启动平台连接失败",
			data: error
		});
		markFailure(error);
		scheduleRestart("fork_error");
	}
	return Promise.resolve();
}

//#endregion
export { getPlatformAdapterState, restartPlatformAdapter, startPlatformAdapterWithFallback };