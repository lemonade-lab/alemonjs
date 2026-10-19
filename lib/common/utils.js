import { logger } from "./logger.js";
import { recordRuntimeError } from "./runtime-scope.js";
import { ResultCode, fileSuffixResponse } from "./variable.js";
import { createUserHashKey, fastHash, isMaster, matchIn, useUserHashKey } from "./identity.js";
import { createResult } from "./result.js";
import fs, { existsSync, readdirSync } from "fs";
import path, { join } from "path";
import { createHash as createHash$1 } from "node:crypto";
import module from "module";

//#region src/common/utils.ts
const initRequire = () => {};
initRequire.resolve = () => "";
const require = module?.createRequire?.(import.meta.url) ?? initRequire;
const createHash = (str, options = {}) => {
	const { length = 11, algorithm = "sha256" } = options;
	return createHash$1(algorithm).update(str).digest("hex").slice(0, length);
};
const _regexpCache = /* @__PURE__ */ new Map();
const getCachedRegExp = (pattern) => {
	if (pattern instanceof RegExp) return pattern;
	let cached = _regexpCache.get(pattern);
	if (!cached) {
		cached = new RegExp(pattern);
		_regexpCache.set(pattern, cached);
	}
	return cached;
};
const createEventName = (url, appKey) => {
	let uri = url;
	if (process.platform === "win32") uri = uri.replace(/\\/g, "/");
	const names = uri.split("/").filter((item) => item !== "");
	names.pop();
	return `${appKey}:${names.join(":")}`;
};
const stringToNumber = (str, size = 33) => {
	let hash = 5381;
	let i = str.length;
	while (i) hash = hash * size ^ str.charCodeAt(--i);
	return hash >>> 0;
};
const getRecursiveDirFiles = (dir, condition = (item) => fileSuffixResponse.test(item.name)) => {
	let results = [];
	if (!existsSync(dir)) return results;
	readdirSync(dir, { withFileTypes: true }).forEach((item) => {
		const fullPath = join(dir, item.name);
		if (item.isDirectory()) results = results.concat(getRecursiveDirFiles(fullPath, condition));
		else if (item.isFile() && condition(item)) results.push({
			path: fullPath,
			name: item.name
		});
	});
	return results;
};
const showErrorModule = (e) => {
	recordRuntimeError(e);
	if (!e) return;
	if (/Cannot find (module|package)/.test(e?.message)) {
		const match = e.stack?.match(/'(.+?)'/);
		if (match) {
			const pack = match[1];
			logger.error({
				code: ResultCode.FailInternal,
				message: `缺少模块或依赖 ${pack},请安装`,
				data: null
			});
			return;
		}
	}
	logger.error({
		code: ResultCode.FailInternal,
		message: e?.message,
		data: e
	});
};
const sanitizeForSerialization = (data) => {
	const flatted = require("flatted");
	return flatted.parse(flatted.stringify(data));
};
const createExports = (packageJson) => {
	if (packageJson?.exports) {
		if (typeof packageJson.exports === "string") return packageJson.exports;
		else if (typeof packageJson.exports === "object") return packageJson.exports["."] || packageJson.exports["./index.js"];
	}
};
const getInputExportPath = (input) => {
	const packageJsonPath = path.join(input ?? process.cwd(), "package.json");
	if (fs.existsSync(packageJsonPath)) {
		const packageJson = require(packageJsonPath);
		const main = packageJson?.main || createExports(packageJson);
		if (main) return main;
	}
};

//#endregion
export { createEventName, createHash, createResult, createUserHashKey, fastHash, getCachedRegExp, getInputExportPath, getRecursiveDirFiles, isMaster, matchIn, sanitizeForSerialization, showErrorModule, stringToNumber, useUserHashKey };