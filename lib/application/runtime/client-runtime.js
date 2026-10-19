import { defaultPort } from "../../common/variable.js";
import "../define-children.js";
import "../define-response.js";
import "../define-middleware.js";
import "../define-router.js";
import { dispatchDisposeAllApps } from "./lifecycle-callbacks.js";
import { clearActiveContexts } from "./context-registry.js";
import { disposeAllRuntimeApps } from "./store.js";
import { scheduleCancelByApp, unregisterAppDir } from "./schedule-store.js";
import "../format/message-api.js";
import "./event-response.js";
import "./event-middleware.js";
import "./event-utils.js";
import "./event-group.js";
import { loadModels } from "./load-modules/load.js";
import { cbpClient } from "./cbp/connects/client.js";
import "./cbp/index.js";
import { createServer } from "./http-server.js";

//#region src/application/runtime/client-runtime.ts
global.__client_loaded = true;
let runtimeDisposed = false;
let runtimeStarted = false;
const disposeClientRuntime = async () => {
	if (runtimeDisposed) return;
	runtimeDisposed = true;
	await dispatchDisposeAllApps();
	clearActiveContexts();
	disposeAllRuntimeApps().forEach((app) => {
		scheduleCancelByApp(app.name);
		unregisterAppDir(app.name);
	});
};
const mainServer = () => {
	const port = process.env.serverPort;
	if (!port) return;
	createServer(port, (actualPort) => {
		process.env._serverPort = String(actualPort);
		if (typeof process.send === "function") process.send({
			type: "server_ready",
			port: actualPort,
			protocolVersion: "v2"
		});
		const httpURL = `http://127.0.0.1:${actualPort}`;
		logger.info(`应用服务器: ${httpURL}`);
	});
};
const main = () => {
	const login = process.env.login ?? "";
	const platform = process.env.platform ?? "";
	const url = process.env.url ?? "";
	const port = process.env.port ?? 17117;
	const isFullReceive = process.env.is_full_receive === "true" || process.env.is_full_receive === "1";
	if (!login && !platform && url) {
		logger.info(`[Connecting to CBP server at ${url}]`);
		cbpClient(url);
	} else cbpClient(`http://127.0.0.1:${port}`, { isFullReceive });
};
const startClientRuntime = async () => {
	if (runtimeStarted) return;
	runtimeStarted = true;
	runtimeDisposed = false;
	main();
	mainServer();
	await loadModels();
	if (process.send) process.send({
		type: "app_ready",
		protocolVersion: "v2"
	});
};

//#endregion
export { disposeClientRuntime, startClientRuntime };