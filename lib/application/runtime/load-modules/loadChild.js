import { ResultCode, fileSuffixMiddleware } from "../../../common/variable.js";
import { createEventName, getRecursiveDirFiles, showErrorModule } from "../../../common/utils.js";
import { registerExpose } from "../../expose.js";
import { dispatchAppDispose, dispatchAppReady, dispatchRuntimeStatusChange } from "../lifecycle-callbacks.js";
import { ChildrenApp, clearRuntimeAppKoaRouters, registerRuntimeApp, setRuntimeAppKoaRouters, updateRuntimeAppCapabilities, updateRuntimeAppStatus } from "../store.js";
import { registerAppDir, scheduleCancelByApp, unregisterAppDir } from "../schedule-store.js";
import { validateContextRegistration } from "../../context.js";
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import module from "module";

//#region src/application/runtime/load-modules/loadChild.ts
const initRequire = () => {};
initRequire.resolve = () => "";
const require = module?.createRequire?.(import.meta.url) ?? initRequire;
const resolvePackageDir = (appName) => {
	const candidatePaths = require.resolve?.paths?.(appName) ?? [];
	for (const basePath of candidatePaths) {
		const packageDir = join(basePath, appName);
		if (existsSync(join(packageDir, "package.json"))) return packageDir;
	}
	return null;
};
const resolvePackageEntryFromPackageJson = (packageDir) => {
	const packageJsonPath = join(packageDir, "package.json");
	if (!existsSync(packageJsonPath)) return null;
	try {
		const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8")) ?? {};
		const exportsField = pkg?.exports;
		let entry = null;
		if (typeof exportsField === "string") entry = exportsField;
		else if (exportsField && typeof exportsField === "object") {
			const rootExport = exportsField["."];
			if (typeof rootExport === "string") entry = rootExport;
			else if (rootExport && typeof rootExport === "object") entry = rootExport.import ?? rootExport.default ?? rootExport.require ?? null;
		}
		if (!entry) entry = pkg?.module ?? pkg?.main ?? "index.js";
		if (typeof entry !== "string" || !entry.trim()) return null;
		return join(packageDir, entry);
	} catch {
		return null;
	}
};
const resolvePackageRoot = (startDir) => {
	let currentDir = startDir;
	while (currentDir && currentDir !== dirname(currentDir)) {
		if (existsSync(join(currentDir, "package.json"))) return currentDir;
		currentDir = dirname(currentDir);
	}
	return startDir;
};
const detectDefaultWebRoot = (packageRoot) => {
	if (existsSync(join(packageRoot, "dist", "index.html"))) return "dist";
	if (existsSync(join(packageRoot, "index.html"))) return "";
	return null;
};
const detectWebCapability = (startDir) => {
	const packageRoot = resolvePackageRoot(startDir);
	const packageJsonPath = join(packageRoot, "package.json");
	if (!existsSync(packageJsonPath)) return Boolean(detectDefaultWebRoot(packageRoot));
	try {
		const root = (require(packageJsonPath) ?? {})?.alemonjs?.web?.root;
		if (typeof root === "string" && root.trim()) return existsSync(join(packageRoot, root));
	} catch {}
	return Boolean(detectDefaultWebRoot(packageRoot));
};
/**
* 加载子模块
* @param mainPath
* @param appName
* @throws {Error} - 如果 mainPath 无效，抛出错误。
*/
const loadChildren = async (mainPath, appName) => {
	if (!mainPath || typeof mainPath !== "string") {
		logger.error({
			code: ResultCode.FailParams,
			message: "The module path is not correct",
			data: null
		});
		return;
	}
	const mainDir = dirname(mainPath);
	const App = new ChildrenApp(appName);
	const kind = appName === "main" ? "main" : "plugin";
	const baseCapabilities = {
		event: false,
		httpApi: existsSync(join(mainDir, "route", "api")),
		web: detectWebCapability(mainDir),
		schedule: false,
		expose: false
	};
	registerRuntimeApp({
		name: appName,
		kind,
		enabled: true,
		status: "discovered",
		rootDir: mainDir,
		mainPath,
		capabilities: baseCapabilities
	});
	updateRuntimeAppStatus(appName, "loading");
	registerAppDir(appName, mainDir);
	try {
		const moduleApp = await import(`file://${mainPath}`);
		if (!moduleApp?.default) throw new Error("The Children is not default");
		if (!moduleApp?.default?._name) throw new Error("The Children name is not correct");
		if (moduleApp.default._name !== "app") throw new Error("The Children name is not correct");
		if (!moduleApp?.default?.callback) throw new Error("The Children callback is not correct");
		let app = null;
		if (typeof moduleApp?.default?.callback !== "function") app = moduleApp?.default.callback;
		else app = await moduleApp.default.callback();
		App.pushCycle(app);
		await dispatchRuntimeStatusChange({
			appName,
			previousStatus: "discovered",
			status: "loading"
		});
		const unMounted = async (e) => {
			showErrorModule(e);
			clearRuntimeAppKoaRouters(appName);
			updateRuntimeAppStatus(appName, "failed", e);
			scheduleCancelByApp(appName);
			unregisterAppDir(appName);
			await dispatchAppDispose(appName, e);
			App.un();
		};
		try {
			if (app?.onCreated) await app?.onCreated();
		} catch (e) {
			unMounted(e);
			return;
		}
		const registerMounted = async () => {
			const res = await app?.register();
			validateContextRegistration(res);
			const hasEventCapability = Boolean(res && (res?.response || res?.middleware || res?.responseRouter || res?.middlewareRouter || res?.middlewareContent || res?.responseContent));
			const hasExposeCapability = Boolean(res?.expose);
			const hasKoaRouterCapability = Boolean(res?.koaRouter);
			if (res && (res?.response || res?.middleware || res?.responseRouter || res?.middlewareRouter || res?.middlewareContent || res?.responseContent)) App.register(res);
			setRuntimeAppKoaRouters(appName, res?.koaRouter);
			if (res?.expose) registerExpose(appName, res.expose.getConfigs());
			updateRuntimeAppCapabilities(appName, {
				...baseCapabilities,
				httpApi: baseCapabilities.httpApi || hasKoaRouterCapability,
				event: hasEventCapability,
				expose: hasExposeCapability
			});
			App.on();
			const emptyStore = {
				response: [],
				responseMiddleware: {},
				middleware: []
			};
			try {
				if (app?.onMounted) await app.onMounted(emptyStore);
				await dispatchAppReady(appName, emptyStore);
				updateRuntimeAppStatus(appName, "ready");
			} catch (e) {
				unMounted(e);
			}
		};
		const fileMounted = async () => {
			const appsDir = join(mainDir, "apps");
			const appsFiles = getRecursiveDirFiles(appsDir);
			const responseDir = join(mainDir, "response");
			const responseFiles = getRecursiveDirFiles(responseDir);
			const files = [...appsFiles, ...responseFiles];
			const resData = [];
			for (const file of files) {
				const url = file.path.replace(mainDir, "");
				const stateKey = createEventName(url, appName);
				const responseItem = {
					input: mainDir,
					dir: dirname(file.path),
					path: file.path,
					name: file.name,
					stateKey,
					appName
				};
				resData.push(responseItem);
			}
			App.pushResponse(resData);
			/**
			* load response middleware files
			*/
			const responseAndMiddlewareFiles = getRecursiveDirFiles(responseDir, (item) => fileSuffixMiddleware.test(item.name));
			const resAndMwData = {};
			for (const file of responseAndMiddlewareFiles) {
				const url = file.path.replace(mainDir, "");
				const stateKey = createEventName(url, appName);
				resAndMwData[stateKey] = {
					input: mainDir,
					dir: dirname(file.path),
					path: file.path,
					name: file.name,
					stateKey,
					appName
				};
			}
			App.pushResponseMiddleware(resAndMwData);
			/**
			* load middleware files
			*/
			const mwDir = join(mainDir, "middleware");
			const mwFiles = getRecursiveDirFiles(mwDir, (item) => fileSuffixMiddleware.test(item.name));
			const mwData = [];
			for (const file of mwFiles) {
				const url = file.path.replace(mainDir, "");
				const stateKey = createEventName(url, appName);
				const middleware = {
					input: mainDir,
					dir: dirname(file.path),
					path: file.path,
					name: file.name,
					stateKey,
					appName
				};
				mwData.push(middleware);
			}
			App.pushMiddleware(mwData);
			updateRuntimeAppCapabilities(appName, {
				...baseCapabilities,
				event: resData.length > 0 || Object.keys(resAndMwData).length > 0 || mwData.length > 0
			});
			App.on();
			const mountedStore = {
				response: resData,
				responseMiddleware: resAndMwData,
				middleware: mwData
			};
			try {
				if (app?.onMounted) await app.onMounted(mountedStore);
				await dispatchAppReady(appName, mountedStore);
				updateRuntimeAppStatus(appName, "ready");
			} catch (e) {
				unMounted(e);
			}
		};
		try {
			if (app?.register) await registerMounted();
			else await fileMounted();
		} catch (e) {
			unMounted(e);
		}
	} catch (e) {
		showErrorModule(e);
		clearRuntimeAppKoaRouters(appName);
		updateRuntimeAppStatus(appName, "failed", e);
		App.un();
	}
};
/**
* 模块文件
* @param app
*/
const loadChildrenFile = async (appName) => {
	if (typeof appName !== "string") {
		logger.error({
			code: ResultCode.FailParams,
			message: "The module name is not correct",
			data: null
		});
		return;
	}
	try {
		let mainPath = require.resolve(appName);
		if (!existsSync(mainPath)) {
			const packageDir = resolvePackageDir(appName);
			const fallbackMainPath = packageDir ? resolvePackageEntryFromPackageJson(packageDir) : null;
			if (fallbackMainPath) mainPath = fallbackMainPath;
		}
		if (!existsSync(mainPath)) {
			updateRuntimeAppStatus(appName, "failed", /* @__PURE__ */ new Error("The main file does not exist," + mainPath));
			logger.error({
				code: ResultCode.FailParams,
				message: "The main file does not exist," + mainPath,
				data: null
			});
			return;
		}
		registerRuntimeApp({
			name: appName,
			kind: "plugin",
			enabled: true,
			status: "discovered",
			rootDir: dirname(mainPath),
			mainPath
		});
		await loadChildren(mainPath, appName);
	} catch (e) {
		const packageDir = resolvePackageDir(appName);
		const fallbackMainPath = packageDir ? resolvePackageEntryFromPackageJson(packageDir) : null;
		if (fallbackMainPath && existsSync(fallbackMainPath)) {
			registerRuntimeApp({
				name: appName,
				kind: "plugin",
				enabled: true,
				status: "discovered",
				rootDir: dirname(fallbackMainPath),
				mainPath: fallbackMainPath
			});
			await loadChildren(fallbackMainPath, appName);
			return;
		}
		updateRuntimeAppStatus(appName, "failed", e);
		showErrorModule(e);
	}
};

//#endregion
export { loadChildren, loadChildrenFile };