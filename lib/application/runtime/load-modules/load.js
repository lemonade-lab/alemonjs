import { ResultCode } from "../../../common/variable.js";
import { getConfig } from "../../../common/config.js";
import { registerRuntimeApp } from "../store.js";
import { loadChildren, loadChildrenFile } from "./loadChild.js";
import { existsSync } from "fs";
import { dirname, join } from "path";
import module from "module";

//#region src/application/runtime/load-modules/load.ts
const initRequire = () => {};
initRequire.resolve = () => "";
const require = module?.createRequire?.(import.meta.url) ?? initRequire;
const loadApps = () => {
	const cfg = getConfig();
	const apps = Array.isArray(cfg.value?.apps) ? cfg.value.apps.filter(Boolean) : Object.entries(cfg.value?.apps ?? {}).filter(([, enabled]) => Boolean(enabled)).map(([name]) => name);
	const uniqueApps = Array.from(new Set(apps));
	return Promise.all(uniqueApps.map(async (app) => {
		registerRuntimeApp({
			name: app,
			kind: "plugin",
			enabled: true,
			status: "discovered",
			rootDir: "",
			mainPath: ""
		});
		await loadChildrenFile(app);
	}));
};
/**
* @description 运行本地模块
* @param input
* @returns
*/
const run = async (input) => {
	if (!input) return;
	const mainPath = join(process.cwd(), input);
	if (!existsSync(mainPath)) {
		logger.warn({
			code: ResultCode.Warn,
			message: "未找到指定的主应用入口文件，但不影响继续运行",
			data: null
		});
		return;
	}
	registerRuntimeApp({
		name: "main",
		kind: "main",
		enabled: true,
		status: "discovered",
		rootDir: join(process.cwd(), dirname(input)),
		mainPath
	});
	await loadChildren(mainPath, "main");
};
/**
* 启动模块进程
*/
async function loadModels() {
	if (!process.env.input) {
		const pkgPath = join(process.cwd(), "package.json");
		if (existsSync(pkgPath)) {
			const pkg = require(pkgPath) ?? {};
			if (pkg?.main) process.env.input = pkg.main;
		}
	}
	await run(process.env.input ?? "");
	await loadApps();
}

//#endregion
export { loadModels, run };