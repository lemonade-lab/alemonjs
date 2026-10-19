import { logger } from "../common/logger.js";
import { ResultCode } from "../common/variable.js";

//#region src/application/define-children.ts
/**
* 定义子事件
* @param callback
* @throws {Error} - 如果 callback 无效，抛出错误。
* @returns
*/
const defineChildren = (callback) => {
	if (typeof callback === "function" || typeof callback === "object") return {
		_name: "app",
		callback
	};
	logger.error({
		code: ResultCode.FailParams,
		message: "Invalid callback: callback must be a object or function",
		data: null
	});
	throw new Error("Invalid callback: callback must be a object or function");
};
global.defineChildren = defineChildren;

//#endregion
export { defineChildren };