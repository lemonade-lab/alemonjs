import { existsSync } from "fs";
import path, { dirname } from "path";

//#region src/application/runtime/http/routers/middleware.ts
async function collectMiddlewares(routeFile) {
	const middlewares = [];
	let dir = dirname(routeFile);
	const suffixes = [
		".ts",
		".js",
		".cjs",
		".mjs",
		".tsx",
		".jsx"
	];
	while (true) {
		for (const ext of suffixes) {
			const mwPath = path.join(dir, `_middleware${ext}`);
			if (existsSync(mwPath)) {
				const mw = (await import(`file://${mwPath}`))?.default ?? {};
				if (typeof mw === "function") middlewares.unshift(mw);
			}
		}
		const parent = dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return middlewares;
}
async function runMiddlewares(middlewares, ctx, handler) {
	let idx = 0;
	async function dispatch() {
		if (idx < middlewares.length) await middlewares[idx++](ctx, dispatch);
		else await handler(ctx);
	}
	await dispatch();
}

//#endregion
export { collectMiddlewares, runMiddlewares };