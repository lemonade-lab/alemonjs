import { defaultPlatformCommonPrefix, filePrefixCommon } from "../common/variable.js";
import { getConfig } from "../common/config.js";
import { generateSocketPath } from "../common/direct-channel.js";
import { publishCBPFileReady } from "./cbp/file-transport.js";
import { cbpServer } from "./cbp/server/main.js";
import { startPlatformAdapterWithFallback } from "./process/platform.js";
import { startModuleAdapter } from "./process/module.js";

//#region src/core/start.ts
/** Notify a fork parent that CBP is usable, without requiring it to host WS. */
const notifyParentCBPReady = (notice) => {
	publishCBPFileReady(notice);
	if (typeof process.send !== "function") return;
	try {
		process.send(notice);
	} catch {}
};
const createOptionsByKey = (options, key, defaultValue) => {
	const cfg = getConfig();
	return options?.[key] ?? cfg.argv?.[key] ?? cfg.value?.[key] ?? defaultValue;
};
/**
* 启动平台服务
*/
const startPlatform = (options) => {
	const platform = createOptionsByKey(options, "platform", "");
	const login = createOptionsByKey(options, "login", "");
	if (!platform && !login) {
		global.__sandbox = true;
		return;
	}
	startPlatformAdapterWithFallback();
};
/**
* 启动客户端
*/
const startClient = (options, port) => {
	process.env.input = createOptionsByKey(options, "input", "");
	process.env.output = createOptionsByKey(options, "output", "");
	process.env.is_full_receive = String(createOptionsByKey(options, "is_full_receive", true));
	process.env.port = String(port ?? (createOptionsByKey(options, "port", "") || ""));
	process.env.url = createOptionsByKey(options, "url", "");
	startModuleAdapter();
};
/**
* 启动 alemonjs
*/
const start = (options = {}) => {
	if (typeof options === "string") options = { input: options };
	global.__options = { ...options };
	const port = createOptionsByKey(options, "port", "");
	const serverPort = createOptionsByKey(options, "serverPort", "");
	const autoPort = createOptionsByKey(options, "autoPort", false);
	const platform = createOptionsByKey(options, "platform", "");
	const login = createOptionsByKey(options, "login", "");
	if (platform) {
		const reg = filePrefixCommon;
		if (reg.test(platform)) {
			process.env.platform = platform;
			process.env.login = platform.replace(reg, "");
		} else {
			process.env.platform = platform;
			process.env.login = platform;
		}
	} else if (login) {
		process.env.platform = `${defaultPlatformCommonPrefix}${login}`;
		process.env.login = login;
	}
	process.env.port = port ? String(port) : "";
	process.env.serverPort = serverPort ? String(serverPort) : "";
	process.env.autoPort = String(autoPort);
	process.env._port = port ? String(port) : "";
	process.env._serverPort = serverPort ? String(serverPort) : "";
	global.__options._port = port ? Number(port) : void 0;
	global.__options._serverPort = serverPort ? Number(serverPort) : void 0;
	if (port) cbpServer(port, (actualPort) => {
		process.env.port = String(actualPort);
		process.env._port = String(actualPort);
		global.__options._port = actualPort;
		const httpURL = `http://127.0.0.1:${actualPort}`;
		const wsURL = `ws://127.0.0.1:${actualPort}`;
		logger.info(`[CBP-Server] ${httpURL}`);
		logger.info(`[CBP-Server] ${wsURL}]`);
		notifyParentCBPReady({
			type: "cbp.ready",
			protocolVersion: "v1",
			transport: "ws",
			port: actualPort,
			wsURL
		});
		startClient(options, actualPort);
		startPlatform(options);
	}, autoPort === true || autoPort === "true" || autoPort === 1 || autoPort === "1");
	else {
		const sockPath = generateSocketPath();
		process.env.__ALEMON_DIRECT_SOCK = sockPath;
		logger.info("[Direct-IPC] 平台↔客户端直连");
		notifyParentCBPReady({
			type: "cbp.ready",
			protocolVersion: "v1",
			transport: "direct",
			socketPath: sockPath
		});
		startClient(options);
		startPlatform(options);
	}
};

//#endregion
export { start };