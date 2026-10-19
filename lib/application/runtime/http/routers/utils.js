import fs, { existsSync } from "fs";
import path from "path";

//#region src/application/runtime/http/routers/utils.ts
const safePath = (root, untrusted) => {
	const resolved = path.resolve(root, untrusted);
	if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
	return resolved;
};
const isValidPackageName = (name) => {
	return /^(?:@[a-z0-9\-~][a-z0-9\-._~]*\/)?[a-z0-9\-~][a-z0-9\-._~]*$/.test(name);
};
const getModuelFile = (dir) => {
	const dirMap = {
		".js": `${dir}.js`,
		".jsx": `${dir}.jsx`,
		".mjs": `${dir}.mjs`,
		".cjs": `${dir}.cjs`,
		"/index.js": `${dir}/index.js`,
		"/index.jsx": `${dir}/index.jsx`,
		"/index.mjs": `${dir}/index.mjs`,
		"/index.cjs": `${dir}/index.cjs`,
		".ts": `${dir}.ts`,
		".tsx": `${dir}.tsx`,
		"/index.ts": `${dir}/index.ts`,
		"/index.tsx": `${dir}/index.tsx`
	};
	for (const key in dirMap) {
		const filePath = dirMap[key];
		if (existsSync(filePath) && fs.statSync(filePath)) return filePath;
	}
	return "";
};
const formatPath = (pathValue) => {
	const normalizedPath = String(pathValue || "").replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/{2,}/g, "/").trim();
	if (!normalizedPath) return "index.html";
	if (normalizedPath === "index" || normalizedPath === "index.html") return "index.html";
	if (normalizedPath.endsWith("/")) return `${normalizedPath}index.html`;
	const parts = normalizedPath.split("/");
	const lastPath = parts[parts.length - 1];
	if (lastPath === "index" || lastPath === "index.html") {
		parts[parts.length - 1] = "index.html";
		return parts.join("/");
	}
	if (lastPath.includes(".")) return normalizedPath;
	return `${normalizedPath}.html`;
};

//#endregion
export { formatPath, getModuelFile, isValidPackageName, safePath };