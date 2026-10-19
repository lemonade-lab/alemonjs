import { ResultCode } from "../../../../common/variable.js";
import { translate } from "../../../../common/i18n.js";
import "../../../../common/index.js";
import { dispatchHttpError } from "../../lifecycle-callbacks.js";
import { getChildrenApp, getRuntimeApp, getRuntimeAppKoaRouters, hasRuntimeAppCapability, listRuntimeAppKoaRouters, listRuntimeApps, toRuntimeAppSnapshot } from "../../store.js";
import { formatPath, getModuelFile, isValidPackageName, safePath } from "./utils.js";
import { collectMiddlewares, runMiddlewares } from "./middleware.js";
import fs, { existsSync } from "fs";
import path, { dirname, join } from "path";
import module from "module";
import KoaRouter from "koa-router";
import { fileURLToPath } from "node:url";
import mime from "mime-types";

//#region src/application/runtime/http/routers/router.ts
const initRequire = () => {};
initRequire.resolve = () => "";
const require = module?.createRequire?.(import.meta.url) ?? initRequire;
const router = new KoaRouter({ prefix: "/" });
const coreFrontendRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../../../dist");
const serveCoreFrontend = (ctx, resourcePath = "index.html") => {
	const filePath = safePath(coreFrontendRoot, resourcePath);
	if (!filePath || !existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;
	const contentType = mime.contentType(path.extname(filePath));
	if (contentType) ctx.set("Content-Type", contentType);
	ctx.status = 200;
	ctx.body = fs.createReadStream(filePath);
	return true;
};
const resolvePackageRoot = (startDir) => {
	let currentDir = startDir;
	while (currentDir && currentDir !== path.dirname(currentDir)) {
		if (existsSync(path.join(currentDir, "package.json"))) return currentDir;
		currentDir = path.dirname(currentDir);
	}
	return startDir;
};
const readWebRootConfig = (packageRoot) => {
	const packageJsonPath = path.join(packageRoot, "package.json");
	if (!existsSync(packageJsonPath)) {
		if (existsSync(path.join(packageRoot, "dist", "index.html"))) return "dist";
		return "";
	}
	const configuredRoot = (require(packageJsonPath) ?? {})?.alemonjs?.web?.root ?? "";
	if (typeof configuredRoot === "string" && configuredRoot.trim()) return configuredRoot;
	if (existsSync(path.join(packageRoot, "dist", "index.html"))) return "dist";
	return "";
};
const matchBasePath = (requestPath, basePath) => {
	if (!basePath) return requestPath;
	if (requestPath === basePath) return "/";
	if (requestPath.startsWith(`${basePath}/`)) return requestPath.slice(basePath.length) || "/";
	return "";
};
const matchApiBasePath = (requestPath, basePath) => {
	return requestPath === basePath || requestPath.startsWith(`${basePath}/`);
};
const needsTrailingSlashRedirect = (requestUrl, basePath) => {
	return requestUrl === basePath || requestUrl.startsWith(`${basePath}?`);
};
const getOriginalPathname = (ctx) => {
	const rawUrl = typeof ctx.originalUrl === "string" && ctx.originalUrl ? ctx.originalUrl : ctx.url;
	const [pathname] = String(rawUrl).split("?");
	return pathname || "/";
};
const rewriteCtxPath = async (ctx, nextPath, handler) => {
	const search = ctx.querystring ? `?${ctx.querystring}` : "";
	const originalUrl = ctx.url;
	const originalReqUrl = ctx.req.url;
	ctx.url = `${nextPath}${search}`;
	ctx.req.url = `${nextPath}${search}`;
	try {
		await handler();
	} finally {
		ctx.url = originalUrl;
		ctx.req.url = originalReqUrl;
	}
};
const denyRuntimeAppAccess = (ctx, appName, capability) => {
	const runtimeApp = getRuntimeApp(appName);
	if (!runtimeApp?.enabled) {
		ctx.status = 404;
		ctx.body = {
			code: 404,
			message: translate("http.appUnavailable"),
			data: null
		};
		return null;
	}
	if (runtimeApp.status === "discovered" || runtimeApp.status === "loading") {
		ctx.status = 503;
		ctx.body = {
			code: 503,
			message: translate("http.appLoading"),
			data: {
				app: appName,
				status: runtimeApp.status
			}
		};
		return null;
	}
	if (runtimeApp.status === "failed") {
		ctx.status = 500;
		ctx.body = {
			code: 500,
			message: translate("http.appFailed"),
			data: {
				app: appName,
				status: runtimeApp.status,
				lifecycle: "failed"
			}
		};
		return null;
	}
	if (runtimeApp.status === "disposed") {
		ctx.status = 410;
		ctx.body = {
			code: 410,
			message: translate("http.appDisposed"),
			data: {
				app: appName,
				status: runtimeApp.status,
				lifecycle: "disposed"
			}
		};
		return null;
	}
	if (runtimeApp.status !== "ready" || !hasRuntimeAppCapability(appName, capability)) {
		ctx.status = 404;
		ctx.body = {
			code: 404,
			message: translate("http.capabilityUnavailable"),
			data: null
		};
		return null;
	}
	return runtimeApp;
};
const getRuntimeAppRouters = (appName) => {
	const registerRouters = getChildrenApp(appName)?.register?.koaRouter;
	const storedRouters = getRuntimeAppKoaRouters(appName);
	return (storedRouters.length ? storedRouters : Array.isArray(registerRouters) ? registerRouters : registerRouters ? [registerRouters] : []).filter(Boolean);
};
const dispatchAppKoaRouters = async (ctx, appName) => {
	const runtimeApp = getRuntimeApp(appName);
	if (!runtimeApp || !runtimeApp.enabled || runtimeApp.status !== "ready" || !hasRuntimeAppCapability(appName, "httpApi")) return false;
	const routers = getRuntimeAppRouters(appName);
	const aliasBases = appName === "main" ? ["/app"] : [`/apps/${appName}`];
	for (const koaRouter of routers) for (const basePath of aliasBases) {
		const rewrittenPath = matchBasePath(ctx.path, basePath);
		if (!rewrittenPath) continue;
		try {
			const matchedContext = ctx;
			const beforeMatched = Array.isArray(matchedContext.matched) ? matchedContext.matched.length : 0;
			const beforeStatus = ctx.status;
			const beforeBody = ctx.body;
			const beforeMatchedRoute = ctx._matchedRoute;
			const beforeRouterPath = ctx.routerPath;
			let fallthrough = false;
			await rewriteCtxPath(ctx, rewrittenPath, async () => {
				await koaRouter.routes()(ctx, async () => {
					fallthrough = true;
				});
			});
			const afterMatched = Array.isArray(matchedContext.matched) ? matchedContext.matched.length : 0;
			const afterMatchedRoute = ctx._matchedRoute;
			const afterRouterPath = ctx.routerPath;
			if (!(afterMatched > beforeMatched || afterMatchedRoute !== beforeMatchedRoute || afterRouterPath !== beforeRouterPath || ctx.status !== beforeStatus || ctx.body !== beforeBody || !fallthrough)) continue;
			await rewriteCtxPath(ctx, rewrittenPath, async () => {
				await koaRouter.allowedMethods()(ctx, async () => {});
			});
			return true;
		} catch (error) {
			if (await dispatchHttpError({
				ctx,
				error,
				appName,
				path: ctx.path,
				method: ctx.method,
				kind: "koa-router"
			})) return true;
			logger.warn({
				code: ResultCode.Fail,
				message: `Error request ${ctx.path}:`,
				data: error instanceof Error ? error.message : String(error)
			});
			ctx.status = 500;
			ctx.body = {
				code: 500,
				message: translate("http.routerFailed"),
				error: error instanceof Error ? error.message : String(error)
			};
			return true;
		}
	}
	return false;
};
const isNamespacedHtmlRequest = (ctx) => {
	if (ctx.method !== "GET") return false;
	if (ctx.path === "/app" || ctx.path.startsWith("/app/")) return !matchApiBasePath(ctx.path, "/app/api");
	if (!ctx.path.startsWith("/apps/")) return false;
	const [, , appName] = ctx.path.split("/");
	if (!appName) return false;
	return !matchApiBasePath(ctx.path, `/apps/${appName}/api`);
};
const dispatchRegisteredKoaRouters = async (ctx) => {
	const registeredRouters = listRuntimeAppKoaRouters();
	const candidates = new Set(registeredRouters.map((item) => item.name));
	listRuntimeApps().forEach((item) => {
		if (item.capabilities?.httpApi) candidates.add(item.name);
	});
	for (const appName of candidates) if (await dispatchAppKoaRouters(ctx, appName)) return true;
	return false;
};
const serveStaticResource = async (ctx, appName, rootDir, resourcePath) => {
	const packageRoot = resolvePackageRoot(rootDir);
	let root = "";
	try {
		root = readWebRootConfig(packageRoot);
	} catch (err) {
		if (await dispatchHttpError({
			ctx,
			error: err,
			appName,
			path: ctx.path,
			method: ctx.method,
			kind: "web"
		})) return "handled";
		ctx.status = 500;
		ctx.body = {
			code: 500,
			message: translate("http.packageFailed"),
			error: err instanceof Error ? err.message : String(err)
		};
		return "handled";
	}
	const webRoot = root ? path.join(packageRoot, root) : packageRoot;
	const fullPath = safePath(webRoot, resourcePath);
	if (!fullPath) {
		ctx.status = 403;
		ctx.body = {
			code: 403,
			message: translate("http.invalidPath"),
			data: null
		};
		return "handled";
	}
	if (!existsSync(fullPath)) return "miss";
	try {
		const file = await fs.promises.readFile(fullPath);
		const mimeType = mime.lookup(fullPath) || "application/octet-stream";
		ctx.set("Content-Type", mimeType);
		ctx.body = file;
		ctx.status = 200;
		return "handled";
	} catch (err) {
		if (await dispatchHttpError({
			ctx,
			error: err,
			appName,
			path: ctx.path,
			method: ctx.method,
			kind: "web"
		})) return "handled";
		ctx.status = 500;
		ctx.body = {
			code: 500,
			message: appName === "main" ? translate("http.resourceFailed") : translate("http.appResourceFailed", { app: appName }),
			error: err instanceof Error ? err.message : String(err)
		};
		return "handled";
	}
};
router.get("/", (ctx) => {
	if (serveCoreFrontend(ctx)) return;
	ctx.status = 503;
	ctx.body = {
		code: 503,
		message: translate("http.frontendMissing"),
		data: null
	};
});
router.get("assets/{*path}", (ctx) => {
	const resourcePath = `assets/${String(ctx.params?.path ?? "")}`;
	if (serveCoreFrontend(ctx, resourcePath)) return;
	ctx.status = 404;
});
router.get("api/online", (ctx) => {
	ctx.status = 200;
	ctx.body = {
		code: 200,
		message: translate("http.online"),
		data: {
			port: process.env._port ? Number(process.env._port) : null,
			serverPort: process.env._serverPort ? Number(process.env._serverPort) : null
		}
	};
});
router.get("api/runtime/apps", (ctx) => {
	const status = String(ctx.query?.status ?? "").trim();
	const data = listRuntimeApps().filter((item) => {
		if (!status) return true;
		return item.status === status;
	});
	ctx.status = 200;
	ctx.body = {
		code: 200,
		message: translate("http.apps"),
		data
	};
});
router.get("api/runtime/apps/:app", (ctx) => {
	const appName = ctx.params.app;
	const runtimeApp = getRuntimeApp(appName);
	if (!runtimeApp) {
		ctx.status = 404;
		ctx.body = {
			code: 404,
			message: translate("http.appMissing"),
			data: null
		};
		return;
	}
	ctx.status = 200;
	ctx.body = {
		code: 200,
		message: translate("http.app"),
		data: toRuntimeAppSnapshot(runtimeApp)
	};
});
router.use(async (ctx, next) => {
	if (isNamespacedHtmlRequest(ctx)) {
		await next();
		return;
	}
	if (await dispatchRegisteredKoaRouters(ctx)) return;
	await next();
});
const handleMainAppRequest = async (ctx) => {
	if (needsTrailingSlashRedirect(getOriginalPathname(ctx), "/app")) {
		ctx.redirect("/app/");
		return;
	}
	if (!process.env.input) {
		ctx.status = 400;
		ctx.body = {
			code: 400,
			message: translate("http.entryMissing"),
			data: null
		};
		return;
	}
	const rootPath = process.cwd();
	const apiPath = "/app/api";
	if (matchApiBasePath(ctx.path, apiPath)) {
		if (!denyRuntimeAppAccess(ctx, "main", "httpApi")) return;
		const mainPath = join(rootPath, process.env.input);
		if (!existsSync(mainPath)) {
			ctx.status = 400;
			ctx.body = {
				code: 400,
				message: translate("http.entryNotFound"),
				data: "existsSync input"
			};
			return;
		}
		const mainDir = dirname(mainPath);
		try {
			const routeBase = join(mainDir, "route");
			const dir = safePath(routeBase, ctx.path?.replace(apiPath, "/api") || "");
			if (!dir) {
				ctx.status = 403;
				ctx.body = {
					code: 403,
					message: translate("http.invalidPath"),
					data: null
				};
				return;
			}
			if (existsSync(dir) && fs.statSync(dir).isFile()) {
				ctx.status = 404;
				ctx.body = {
					code: 404,
					message: translate("http.apiNotFound", { path: ctx.path }),
					data: "route path is file not directory"
				};
				return;
			}
			const modulePath = getModuelFile(dir);
			if (!modulePath) {
				ctx.status = 404;
				ctx.body = {
					code: 404,
					message: translate("http.apiNotFound", { path: ctx.path }),
					data: "existsSync modulePath"
				};
				return;
			}
			const handler = (await import(`file://${modulePath}`))[ctx.method];
			if (!handler || typeof handler !== "function") {
				ctx.status = 405;
				return;
			}
			const middlewares = await collectMiddlewares(modulePath);
			await runMiddlewares(middlewares, ctx, handler);
		} catch (err) {
			if (await dispatchHttpError({
				ctx,
				error: err,
				appName: "main",
				path: ctx.path,
				method: ctx.method,
				kind: "api"
			})) return;
			ctx.status = 500;
			ctx.body = {
				code: 500,
				message: translate("http.apiFailed"),
				error: err instanceof Error ? err.message : String(err)
			};
		}
		return;
	}
	if (ctx.method !== "GET") {
		ctx.status = 405;
		return;
	}
	const runtimeApp = getRuntimeApp("main");
	const resourcePath = formatPath(ctx.params?.path);
	if (!runtimeApp?.enabled || runtimeApp.status !== "ready") {
		denyRuntimeAppAccess(ctx, "main", "web");
		return;
	}
	if (hasRuntimeAppCapability("main", "web")) {
		if (await serveStaticResource(ctx, "main", runtimeApp.rootDir, resourcePath) === "handled") return;
	}
	if (await dispatchAppKoaRouters(ctx, "main")) return;
	if (!hasRuntimeAppCapability("main", "web")) {
		denyRuntimeAppAccess(ctx, "main", "web");
		return;
	}
	ctx.status = 404;
	ctx.body = {
		code: 404,
		message: translate("http.resourceNotFound"),
		data: null
	};
};
router.all("app", handleMainAppRequest);
router.all("app/", handleMainAppRequest);
router.all("app/{*path}", handleMainAppRequest);
const handlePluginAppRequest = async (ctx) => {
	const appName = ctx.params.app;
	if (!isValidPackageName(appName)) {
		ctx.status = 400;
		ctx.body = {
			code: 400,
			message: translate("http.invalidApp"),
			data: null
		};
		return;
	}
	if (needsTrailingSlashRedirect(getOriginalPathname(ctx), `/apps/${appName}`)) {
		ctx.redirect(`/apps/${appName}/`);
		return;
	}
	const apiPath = `/apps/${appName}/api`;
	if (matchApiBasePath(ctx.path, apiPath)) {
		const runtimeApp = denyRuntimeAppAccess(ctx, appName, "httpApi");
		if (!runtimeApp) return;
		try {
			const routeBase = join(runtimeApp.rootDir, "route");
			const dir = safePath(routeBase, ctx.path?.replace(apiPath, "/api") || "");
			if (!dir) {
				ctx.status = 403;
				ctx.body = {
					code: 403,
					message: translate("http.invalidPath"),
					data: null
				};
				return;
			}
			if (existsSync(dir) && fs.statSync(dir).isFile()) {
				ctx.status = 404;
				ctx.body = {
					code: 404,
					message: translate("http.routeNotFound", { path: ctx.path }),
					data: "route path is file not directory"
				};
				return;
			}
			const modulePath = getModuelFile(dir);
			if (!modulePath) {
				ctx.status = 404;
				ctx.body = {
					code: 404,
					message: translate("http.apiNotFound", { path: ctx.path }),
					data: "existsSync modulePath"
				};
				return;
			}
			const handler = (await import(`file://${modulePath}`))[ctx.method];
			if (!handler || typeof handler !== "function") {
				ctx.status = 405;
				return;
			}
			const middlewares = await collectMiddlewares(modulePath);
			await runMiddlewares(middlewares, ctx, handler);
		} catch (err) {
			if (await dispatchHttpError({
				ctx,
				error: err,
				appName,
				path: ctx.path,
				method: ctx.method,
				kind: "api"
			})) return;
			logger.warn({
				code: ResultCode.Fail,
				message: `Error request ${ctx.path}:`,
				data: err instanceof Error ? err.message : String(err)
			});
			ctx.status = 500;
			ctx.body = {
				code: 500,
				message: translate("http.apiFailed"),
				error: err instanceof Error ? err.message : String(err)
			};
		}
		return;
	}
	if (ctx.method !== "GET") {
		ctx.status = 405;
		return;
	}
	const runtimeApp = getRuntimeApp(appName);
	const resourcePath = formatPath(ctx.params?.path);
	if (!runtimeApp?.enabled || runtimeApp.status !== "ready") {
		denyRuntimeAppAccess(ctx, appName, "web");
		return;
	}
	if (hasRuntimeAppCapability(appName, "web")) {
		if (await serveStaticResource(ctx, appName, runtimeApp.rootDir, resourcePath) === "handled") return;
	}
	if (await dispatchAppKoaRouters(ctx, appName)) return;
	if (!hasRuntimeAppCapability(appName, "web")) {
		denyRuntimeAppAccess(ctx, appName, "web");
		return;
	}
	ctx.status = 404;
	ctx.body = {
		code: 404,
		message: translate("http.appResourceNotFound", {
			resource: resourcePath,
			app: appName
		}),
		data: null
	};
};
router.all("apps/:app", handlePluginAppRequest);
router.all("apps/:app/", handlePluginAppRequest);
router.all("apps/:app/{*path}", handlePluginAppRequest);

//#endregion
export { router as default };