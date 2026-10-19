import { logger, shutdownLogger } from "../common/logger.js";

//#region src/platform/define-platform.ts
const definePlatform = (options) => {
	const platformName = options.name || process.env.platform || "unknown";
	if (global.__platform_bootstrap_loaded) return options.main;
	const mainProcess = () => {
		let stopping = false;
		let runtimeCleanup;
		const shutdown = async (reason) => {
			if (stopping) return;
			stopping = true;
			logger.info?.(`[${platformName}][${reason}] 收到信号，正在关闭...`);
			if (runtimeCleanup) {
				let timer;
				try {
					await Promise.race([Promise.resolve().then(runtimeCleanup), new Promise((resolve) => {
						timer = setTimeout(resolve, 5e3);
					})]);
				} catch {
					logger.error?.(`[${platformName}] 平台清理失败`);
				} finally {
					if (timer) clearTimeout(timer);
				}
			}
			await shutdownLogger();
			process.exit(0);
		};
		[
			"SIGINT",
			"SIGTERM",
			"SIGQUIT",
			"disconnect"
		].forEach((sig) => {
			process?.on?.(sig, () => {
				shutdown(sig);
			});
		});
		process?.once?.("beforeExit", (code) => {
			logger.info?.(`[${platformName}][exit] 进程退出，code=${code}`);
			shutdownLogger();
		});
		process.on("message", (msg) => {
			try {
				const data = typeof msg === "string" ? JSON.parse(msg) : msg;
				if (data?.type === "start") Promise.resolve(options.main()).then((runtime) => {
					if (typeof runtime?.stop === "function") runtimeCleanup = () => runtime.stop();
				}).catch(() => {
					logger.error?.(`[${platformName}] 平台启动失败`);
				});
				else if (data?.type === "stop") shutdown("stop");
			} catch {}
		});
		if (process.send) process.send(JSON.stringify({ type: "ready" }));
	};
	if (!global.__client_loaded) mainProcess();
	return options.main;
};

//#endregion
export { definePlatform };