import { createReadStream, existsSync, writeFile } from "fs";
import { basename } from "path";
import { toDataURL } from "qrcode";
import axios from "axios";
import { Readable, isReadable } from "node:stream";
import { fileTypeFromBuffer, fileTypeFromStream } from "file-type";
import { publicIp } from "public-ip";
import { Buffer } from "buffer";
import { HttpsProxyAgent } from "https-proxy-agent";

//#region src/utils.ts
/**
* 不会被alemonjs引用
* 但会被插件应用的工具函数
* 用于为开发提供便利函数
* 适用于大部分场景
* 避免重复造轮子
* 该工具使用需要安装必要的包
* npm install axios qrcode file-type public-ip https-proxy-agent
* @description 工具函数
*/
/**
* 通过URL获取Buffer
* @param url
* @returns
*/
const getBufferByURL = async (url) => {
	return await axios.get(url, { responseType: "arraybuffer" }).then((res) => Buffer.from(res.data, "binary"));
};
/**
* 生成二维码
* @param text
* @param targetPath
* @returns
*/
const createQRCode = async (text, targetPath) => {
	try {
		const qrDataURL = await new Promise((resolve, reject) => {
			toDataURL(text, {
				margin: 2,
				width: 500
			}, (err, qrDataURL) => {
				if (err) {
					console.error(err);
					reject(err);
				} else resolve(qrDataURL);
			});
		});
		const bufferData = Buffer.from(qrDataURL.split(",")[1], "base64");
		if (targetPath) writeFile(targetPath, bufferData, (err) => {
			if (err) throw err;
			console.info(targetPath);
		});
		return bufferData;
	} catch (err) {
		console.error(err);
		return false;
	}
};
/**
* 计数器类
* 用于生成递增的数字ID等场景
*/
var Counter = class {
	#counter = 1;
	#val = 0;
	/**
	* 计数器
	* @param initialValue
	*/
	constructor(initialValue) {
		this.#counter = initialValue;
		this.#val = initialValue;
	}
	/**
	* 获取当前计数值
	*/
	get value() {
		return this.#counter;
	}
	/**
	* 获取下一个计数值
	* @returns
	*/
	next() {
		return ++this.#counter;
	}
	/**
	* 重置计数器
	* @param initialValue
	*/
	reStart(initialValue) {
		if (initialValue !== void 0) {
			this.#val = initialValue;
			this.#counter = initialValue;
		} else this.#counter = this.#val;
	}
};
/**
* 创建form
* @param options.url
* @param options.image
* @param options.name
* @description 支持以下几种方式创建图片数据：
* 1. 通过url获取图片数据
* 2. 通过图片路径获取图片数据
* 3. 通过base64字符串获取图片数据
* 4. 通过Buffer获取图片数据
* 5. 通过Readable流获取图片数据
* @returns
*/
async function createPicFrom(options) {
	let { url, image, name } = options;
	let picData;
	const pushBuffer = (buffer) => {
		picData = new Readable();
		picData.push(buffer);
		picData.push(null);
	};
	if (url) {
		if (!existsSync(url)) return;
		if (!name) name = basename(url.toString());
		picData = createReadStream(url);
	} else if (typeof image === "string") {
		if (image.startsWith("data:")) {
			const base64Data = image.split(",")[1];
			const buffer = Buffer.from(base64Data, "base64");
			name = "file." + ((await fileTypeFromBuffer(buffer))?.ext ?? "jpg");
			pushBuffer(buffer);
		} else if (existsSync(image)) {
			if (!name) name = basename(image);
			picData = createReadStream(image);
		} else return;
	} else if (Buffer.isBuffer(image)) {
		if (!name) name = "file." + ((await fileTypeFromBuffer(image))?.ext ?? "jpg");
		pushBuffer(image);
	} else if (isReadable(image)) {
		if (!name) {
			const img = Readable.toWeb(image);
			name = "file." + ((await fileTypeFromStream(img))?.ext ?? "jpg");
		}
		picData = image;
	} else return;
	return {
		picData,
		name
	};
}
/**
*
* @param options
* @returns
*/
const getPublicIP = async (options = {}) => {
	const { force, ...config } = options;
	if (global.__publicIp && !force) return global.__publicIp;
	return await publicIp({
		onlyHttps: true,
		...config
	}).then((ip) => {
		global.__publicIp = ip;
		return global.__publicIp;
	});
};
/**
* 正则表达式工具类
*/
var Regular = class Regular extends RegExp {
	/**
	* 创建 Regular 实例
	* @param pattern
	* @param flags
	* @returns
	*/
	static create(pattern, flags) {
		return new Regular(pattern, flags);
	}
	/**
	* 合并多个正则表达式的 flags，去重并排序
	* @param flags
	* @returns
	*/
	static mergeFlags(...flags) {
		const flagSet = /* @__PURE__ */ new Set();
		for (const flagStr of flags) for (const char of flagStr) flagSet.add(char);
		return Array.from(flagSet).sort().join("");
	}
	/**
	* @param regulars
	* @returns
	*/
	static or(...regulars) {
		const source = regulars.map((reg) => `(?:${reg.source})`).join("|");
		const flags = Regular.mergeFlags(...regulars.map((reg) => reg.flags));
		return new Regular(`(?:${source})`, flags);
	}
	/**
	* @param regulars
	* @returns
	*/
	static and(...regulars) {
		const lookAHeads = regulars.map((reg) => `(?=.*${reg.source})`).join("");
		const flags = Regular.mergeFlags(...regulars.map((reg) => reg.flags));
		return new Regular(`${lookAHeads}.*`, flags);
	}
	or(...regulars) {
		return Regular.or(this, ...regulars);
	}
	and(...regulars) {
		return Regular.and(this, ...regulars);
	}
	/**
	* 追加新的 flags
	*/
	withFlags(flags) {
		const mergedFlags = Regular.mergeFlags(this.flags, flags);
		return new Regular(this.source, mergedFlags);
	}
	/**
	* 去除指定的 flags
	*/
	withoutFlags(flagsToRemove) {
		const currentFlagsSet = new Set(this.flags);
		for (const char of flagsToRemove) currentFlagsSet.delete(char);
		const newFlags = Array.from(currentFlagsSet).sort().join("");
		return new Regular(this.source, newFlags);
	}
};
const filterHeaders = (headers = {}) => {
	if (!headers) return headers;
	const filtered = {};
	const sensitiveKeys = [
		/^authorization$/i,
		/^cookie$/i,
		/^set-cookie$/i,
		/token/i,
		/key/i,
		/jwt/i,
		/^session[-_]id$/i,
		/^uid$/i,
		/^user[-_]id$/i
	];
	for (const key in headers) {
		if (/^_/.test(key)) continue;
		if (typeof key === "symbol") continue;
		if (typeof headers[key] === "function") continue;
		if (sensitiveKeys.some((re) => re.test(key))) filtered[key] = "******";
		else filtered[key] = headers[key];
	}
	return filtered;
};
const filterConfig = (config = {}) => {
	if (!config) return config;
	const filtered = {};
	for (const key in config) {
		if (/^_/.test(key)) continue;
		if (typeof key === "symbol") continue;
		if (typeof config[key] === "function") continue;
		filtered[key] = config[key];
	}
	return filtered;
};
const filterRequest = (request = {}) => {
	if (!request) return request;
	const filtered = {};
	for (const key in request) {
		if (/^_/.test(key)) continue;
		if (typeof key === "symbol") continue;
		if (typeof request[key] === "function") continue;
		filtered[key] = request[key];
	}
	return filtered;
};
const loggerError = (err) => {
	const errorData = {
		config: {
			headers: filterHeaders(err?.config?.headers),
			params: err?.config?.params,
			data: err?.config?.data
		},
		response: {
			status: err?.response?.status,
			statusText: err?.response?.statusText,
			headers: filterHeaders(err?.response?.headers),
			config: filterConfig(err?.response?.config),
			request: filterRequest(err?.response?.request),
			data: err?.response?.data
		},
		message: err?.message
	};
	if (global?.logger) global.logger.error(errorData);
	else console.error(errorData);
};
/**
* 基础请求
* @param service
* @param options
* @returns
*/
const createAxiosInstance = async (service, options) => {
	try {
		return (await service(options))?.data ?? {};
	} catch (err) {
		loggerError(err);
		throw err?.response?.data ?? err;
	}
};
/**
* 创建一个可配代理的请求实例
* @param options
* @returns
*/
const request = (options) => {
	const { requestProxy, ...requestConfig } = options;
	if (requestProxy) requestConfig.httpsAgent = new HttpsProxyAgent(requestProxy);
	const service = axios.create({
		...requestConfig,
		timeout: 6e3
	});
	return createAxiosInstance(service, options);
};

//#endregion
export { Counter, Regular, createAxiosInstance, createPicFrom, createQRCode, getBufferByURL, getPublicIP, request };