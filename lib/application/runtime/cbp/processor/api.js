import { runtimeExecution, runtimeScope, trackRuntimeTask } from "../../../../common/runtime-scope.js";
import { ResultCode } from "../../../../common/variable.js";
import { translate } from "../../../../common/i18n.js";
import { createResult } from "../../../../common/result.js";
import { sanitizeForSerialization } from "../../../../common/utils.js";
import { timeoutTime } from "../../../../common/cbp/constants.js";
import { deviceId, generateUniqueId } from "../../../../common/cbp/runtime.js";
import { createApiRequestEnvelope } from "../../../../common/cbp/normalize.js";
import "../../../../common/index.js";
import { apiRequestResolves, apiRequestTimeouts } from "./request-registry.js";
import { getDirectSend } from "./transport.js";
import * as flattedJSON from "flatted";

//#region src/application/runtime/cbp/processor/api.ts
/**
* 设置超时和回调（公用）
*/
const setupApiResolve = (requestId, resolve) => {
	apiRequestResolves.set(requestId, resolve);
	const timeout = setTimeout(() => {
		if (!apiRequestResolves.has(requestId) || !apiRequestTimeouts.has(requestId)) return;
		apiRequestResolves.delete(requestId);
		apiRequestTimeouts.delete(requestId);
		resolve([createResult(ResultCode.Fail, translate("result.api.request.timed.out"), null)]);
	}, timeoutTime);
	apiRequestTimeouts.set(requestId, timeout);
};
/**
* 发送接口请求
* 优先级：直连通道 > fork IPC > WebSocket
* @param data
*/
const sendAPI = (data) => {
	const scope = runtimeScope.getStore();
	if (scope) {
		if (scope.disposed || runtimeExecution.getStore()?.closed) return trackRuntimeTask(Promise.reject(/* @__PURE__ */ new Error("Test execution is closed")), false);
		return trackRuntimeTask(scope.api(data), false);
	}
	const requestId = generateUniqueId();
	return new Promise((resolve) => {
		data.apiId = requestId;
		data.DeviceId = deviceId;
		const envelope = createApiRequestEnvelope(data);
		const safeData = sanitizeForSerialization(envelope);
		const directSend = getDirectSend();
		if (directSend) {
			directSend(safeData);
			setupApiResolve(requestId, resolve);
			return;
		}
		if (process.env.__ALEMON_IPC === "1" && typeof process.send === "function") {
			process.send({
				type: "ipc:data",
				data: safeData
			});
			setupApiResolve(requestId, resolve);
			return;
		}
		if (!global.chatbotClient?.send) {
			resolve([createResult(ResultCode.Fail, translate("result.chatbot.client.is.not.available"), null)]);
			return;
		}
		global.chatbotClient?.send(flattedJSON.stringify(safeData));
		setupApiResolve(requestId, resolve);
	});
};

//#endregion
export { sendAPI };