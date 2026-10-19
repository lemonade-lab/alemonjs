import { logger } from "./logger.js";
import { ResultCode } from "./variable.js";

//#region src/common/result.ts
const createResult = (code, message, data) => {
	if (code !== ResultCode.Ok) logger.error({
		code,
		message,
		data
	});
	return {
		code,
		message,
		data
	};
};

//#endregion
export { createResult };