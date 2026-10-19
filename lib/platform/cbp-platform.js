import { ResultCode } from "../common/variable.js";
import { sanitizeForSerialization } from "../common/utils.js";
import { createDirectClient } from "../common/direct-channel.js";
import { deviceId } from "../common/cbp/runtime.js";
import { createWSConnector } from "../common/cbp/ws-connector.js";
import { createActionResponseEnvelope, createApiResponseEnvelope, createEventEnvelope, isNormalizedActionRequest, isNormalizedApiRequest, normalizeInboundMessage, toLegacyActionData, toLegacyApiData } from "../common/cbp/normalize.js";
import "../common/index.js";
import * as flattedJSON from "flatted";
import { WebSocket } from "ws";
import QRCode from "qrcode";

//#region src/platform/cbp-platform.ts
const notifyTransportReady = (transport) => {
	if (typeof process.send === "function") process.send({
		type: "transport_ready",
		protocolVersion: "v2",
		transport
	});
};
/**
* Login UX belongs to CBP, not to an individual platform adapter.  Adapters
* only emit login.qrcode; CBP presents the same terminal fallback everywhere.
*/
const printLoginQRCode = async (data) => {
	if (data.name !== "login.qrcode") return;
	const { Platform, LoginId, QRCode: challenge } = data;
	let terminalQRCode = "";
	try {
		terminalQRCode = await QRCode.toString(challenge.url, {
			type: "terminal",
			small: true
		});
	} catch {}
	const output = [
		`[CBP][${Platform}] ${challenge.refreshed ? "二维码已刷新，请重新扫描" : "请扫描二维码完成登录"}`,
		terminalQRCode,
		`登录标识：${LoginId}`,
		`二维码链接：${challenge.url}`
	].filter(Boolean);
	logger.info(`\n${output.join("\n")}`);
};
const publishPlatformEvent = (data) => {
	printLoginQRCode(data);
};
const dispatchLegacyActionHandlers = (actionReplys, replyAction, input) => {
	const normalized = normalizeInboundMessage(input);
	if (!isNormalizedActionRequest(normalized)) return false;
	const legacy = toLegacyActionData(normalized);
	for (const cb of actionReplys) cb(legacy, (val) => replyAction(legacy, val));
	return true;
};
const dispatchLegacyApiHandlers = (apiReplys, replyApi, input) => {
	const normalized = normalizeInboundMessage(input);
	if (!isNormalizedApiRequest(normalized)) return false;
	const legacy = toLegacyApiData(normalized);
	for (const cb of apiReplys) cb(legacy, (val) => replyApi(legacy, val));
	return true;
};
const cbpPlatformDirect = (sockPath, open) => {
	const actionReplys = [];
	const apiReplys = [];
	let channel = null;
	const pendingQueue = [];
	const send = (data) => {
		publishPlatformEvent(data);
		data.DeviceId = deviceId;
		data.CreateAt = Date.now();
		const envelope = createEventEnvelope(data);
		if (typeof process.send === "function") process.send({
			type: "cbp.event",
			protocolVersion: "v1",
			data: sanitizeForSerialization(envelope)
		});
		if (channel) channel.send(envelope);
		else pendingQueue.push(envelope);
	};
	const replyAction = (data, payload) => {
		channel?.send(createActionResponseEnvelope(data, payload));
	};
	const replyApi = (data, payload) => {
		channel?.send(createApiResponseEnvelope(data, payload));
	};
	const onactions = (reply) => {
		actionReplys.push(reply);
	};
	const onapis = (reply) => {
		apiReplys.push(reply);
	};
	createDirectClient(sockPath, (data) => {
		if (dispatchLegacyApiHandlers(apiReplys, replyApi, data)) return;
		dispatchLegacyActionHandlers(actionReplys, replyAction, data);
	}).then((ch) => {
		channel = ch;
		for (const msg of pendingQueue) channel.send(msg);
		pendingQueue.length = 0;
		notifyTransportReady("direct");
		open();
		logger.debug({
			code: ResultCode.Ok,
			message: "平台端已启用直连通道模式（Unix Domain Socket）",
			data: null
		});
	}).catch((err) => {
		logger.error({
			code: ResultCode.Fail,
			message: "平台端直连通道建立失败，回退 fork IPC",
			data: err
		});
		cbpPlatformIPC(open, actionReplys, apiReplys);
	});
	return {
		send,
		onactions,
		onapis
	};
};
const cbpPlatformIPC = (open, existingActionReplys, existingApiReplys) => {
	const actionReplys = existingActionReplys ?? [];
	const apiReplys = existingApiReplys ?? [];
	const send = (data) => {
		publishPlatformEvent(data);
		if (typeof process.send === "function") {
			data.DeviceId = deviceId;
			data.CreateAt = Date.now();
			const envelope = createEventEnvelope(data);
			process.send({
				type: "ipc:data",
				data: sanitizeForSerialization(envelope)
			});
		}
	};
	const replyAction = (data, payload) => {
		if (typeof process.send === "function") process.send({
			type: "ipc:data",
			data: sanitizeForSerialization(createActionResponseEnvelope(data, payload))
		});
	};
	const replyApi = (data, payload) => {
		if (typeof process.send === "function") process.send({
			type: "ipc:data",
			data: sanitizeForSerialization(createApiResponseEnvelope(data, payload))
		});
	};
	const onactions = (reply) => {
		actionReplys.push(reply);
	};
	const onapis = (reply) => {
		apiReplys.push(reply);
	};
	process.on("message", (message) => {
		try {
			const msg = typeof message === "string" ? JSON.parse(message) : message;
			if (msg?.type === "ipc:data") {
				if (dispatchLegacyApiHandlers(apiReplys, replyApi, msg.data)) return;
				dispatchLegacyActionHandlers(actionReplys, replyAction, msg.data);
			}
		} catch (error) {
			logger.error({
				code: ResultCode.Fail,
				message: "IPC 平台端解析消息失败",
				data: error
			});
		}
	});
	notifyTransportReady("ipc");
	open();
	logger.debug({
		code: ResultCode.Ok,
		message: "平台端已启用 IPC 极速通讯模式",
		data: null
	});
	return {
		send,
		onactions,
		onapis
	};
};
const cbpPlatform = (url, options = { open: () => {} }) => {
	const { open = () => {} } = options;
	if (process.env.__ALEMON_DIRECT_SOCK && typeof process.send === "function") return cbpPlatformDirect(process.env.__ALEMON_DIRECT_SOCK, open);
	if (process.env.__ALEMON_IPC === "1" && typeof process.send === "function") return cbpPlatformIPC(open);
	const createCurrentURL = () => {
		if (url) {
			if (url.startsWith("ws://") || url.startsWith("wss://")) return url;
			if (/^\d+$/.test(url)) return `ws://localhost:${url}`;
		}
		if (process.env.__ALEMON_PLATFORM_WS_URL) return process.env.__ALEMON_PLATFORM_WS_URL;
	};
	const currentURL = createCurrentURL() || `ws://localhost:${process.env.port || 17117}`;
	const send = (data) => {
		publishPlatformEvent(data);
		if (global.chatbotPlatform?.readyState === WebSocket.OPEN) {
			data.DeviceId = deviceId;
			data.CreateAt = Date.now();
			const envelope = createEventEnvelope(data);
			global.chatbotPlatform.send(flattedJSON.stringify(sanitizeForSerialization(envelope)));
		}
	};
	const actionReplys = [];
	const apiReplys = [];
	const replyAction = (data, payload) => {
		if (global.chatbotPlatform?.readyState === WebSocket.OPEN) global.chatbotPlatform.send(flattedJSON.stringify(createActionResponseEnvelope(data, payload)));
	};
	const replyApi = (data, payload) => {
		if (global.chatbotPlatform?.readyState === WebSocket.OPEN) global.chatbotPlatform.send(flattedJSON.stringify(createApiResponseEnvelope(data, payload)));
	};
	const onactions = (reply) => {
		actionReplys.push(reply);
	};
	const onapis = (reply) => {
		apiReplys.push(reply);
	};
	createWSConnector({
		url: currentURL,
		role: "platform",
		globalKey: "chatbotPlatform",
		onOpen: () => {
			notifyTransportReady("ws");
			open();
		},
		onMessage: (messageStr) => {
			try {
				const data = flattedJSON.parse(messageStr);
				if (dispatchLegacyApiHandlers(apiReplys, replyApi, data)) return;
				dispatchLegacyActionHandlers(actionReplys, replyAction, data);
			} catch (error) {
				logger.error({
					code: ResultCode.Fail,
					message: "解析消息失败",
					data: error
				});
			}
		}
	});
	return {
		send,
		onactions,
		onapis
	};
};

//#endregion
export { cbpPlatform };