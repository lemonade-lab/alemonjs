import { runtimeExecution, runtimeScope, trackRuntimeTask } from "../../../../common/runtime-scope.js";
import { ResultCode } from "../../../../common/variable.js";
import { translate } from "../../../../common/i18n.js";
import { createResult } from "../../../../common/result.js";
import { sanitizeForSerialization } from "../../../../common/utils.js";
import { timeoutTime } from "../../../../common/cbp/constants.js";
import { deviceId, generateUniqueId } from "../../../../common/cbp/runtime.js";
import { createActionRequestEnvelope } from "../../../../common/cbp/normalize.js";
import "../../../../common/index.js";
import { actionRequestResolves, actionRequestTimeouts } from "./request-registry.js";
import { getDirectSend } from "./transport.js";
import * as flattedJSON from "flatted";

//#region src/application/runtime/cbp/processor/actions.ts
/**
* 设置超时和回调（公用）
*/
const setupActionResolve = (requestId, resolve) => {
	actionRequestResolves.set(requestId, resolve);
	const timeout = setTimeout(() => {
		if (!actionRequestResolves.has(requestId) || !actionRequestTimeouts.has(requestId)) return;
		actionRequestResolves.delete(requestId);
		actionRequestTimeouts.delete(requestId);
		resolve([createResult(ResultCode.Fail, translate("result.action.timed.out"), null)]);
	}, timeoutTime);
	actionRequestTimeouts.set(requestId, timeout);
};
/**
* 发送行为
* 优先级：直连通道 > fork IPC > WebSocket
* @param data
*/
const sendAction = (data) => {
	const scope = runtimeScope.getStore();
	if (scope) {
		if (scope.disposed || runtimeExecution.getStore()?.closed) return trackRuntimeTask(Promise.reject(/* @__PURE__ */ new Error("Test execution is closed")), false);
		return trackRuntimeTask(scope.action(data), false);
	}
	const requestId = generateUniqueId();
	return new Promise((resolve) => {
		data.actionId = requestId;
		data.DeviceId = deviceId;
		const envelope = createActionRequestEnvelope(data);
		const safeData = sanitizeForSerialization(envelope);
		const directSend = getDirectSend();
		if (directSend) {
			directSend(safeData);
			setupActionResolve(requestId, resolve);
			return;
		}
		if (process.env.__ALEMON_IPC === "1" && typeof process.send === "function") {
			process.send({
				type: "ipc:data",
				data: safeData
			});
			setupActionResolve(requestId, resolve);
			return;
		}
		if (!global.chatbotClient?.send) {
			resolve([createResult(ResultCode.Fail, translate("result.chatbot.client.is.not.available"), null)]);
			return;
		}
		global.chatbotClient?.send(flattedJSON.stringify(safeData));
		setupActionResolve(requestId, resolve);
	});
};

//#endregion
export { sendAction };