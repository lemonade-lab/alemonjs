import { ResultCode } from "../../../../common/variable.js";
import { translate } from "../../../../common/i18n.js";
import { createResult } from "../../../../common/result.js";
import { createDirectServer } from "../../../../common/direct-channel.js";
import { FULL_RECEIVE_HEADER } from "../../../../common/cbp/constants.js";
import { createWSConnector } from "../../../../common/cbp/ws-connector.js";
import { normalizeInboundMessage } from "../../../../common/cbp/normalize.js";
import "../../../../common/index.js";
import { actionRequestResolves, actionRequestTimeouts, apiRequestResolves, apiRequestTimeouts } from "../processor/request-registry.js";
import { setDirectSend } from "../processor/transport.js";
import { onProcessor } from "../../event-processor.js";
import * as flattedJSON from "flatted";

//#region src/application/runtime/cbp/connects/client.ts
const notifyTransportReady = (transport) => {
	if (typeof process.send === "function") process.send({
		type: "transport_ready",
		protocolVersion: "v2",
		transport
	});
};
/**
* 通用入站消息处理（直连 / IPC / WS 共用）
*/
const handleInboundMessage = (message) => {
	const normalized = normalizeInboundMessage(message);
	if (!normalized) return;
	if (normalized.kind === "api.res") {
		const resolve = apiRequestResolves.get(normalized.replyTo);
		if (resolve) {
			apiRequestResolves.delete(normalized.replyTo);
			const timeout = apiRequestTimeouts.get(normalized.replyTo);
			if (timeout) {
				apiRequestTimeouts.delete(normalized.replyTo);
				clearTimeout(timeout);
			}
			if (Array.isArray(normalized.results)) resolve(normalized.results);
			else resolve([createResult(ResultCode.Fail, translate("result.api.processing.failed"), null)]);
		}
	} else if (normalized.kind === "action.res") {
		const resolve = actionRequestResolves.get(normalized.replyTo);
		if (resolve) {
			actionRequestResolves.delete(normalized.replyTo);
			const timeout = actionRequestTimeouts.get(normalized.replyTo);
			if (timeout) {
				actionRequestTimeouts.delete(normalized.replyTo);
				clearTimeout(timeout);
			}
			if (Array.isArray(normalized.results)) resolve(normalized.results);
			else resolve([createResult(ResultCode.Fail, translate("result.action.processing.failed"), null)]);
		}
	} else if (normalized.kind === "event") onProcessor(normalized.eventName, normalized.event, normalized.raw);
	else if (normalized.kind === "control" && normalized.op === "sync") {
		const env = normalized.payload?.env;
		if (env && typeof env === "object") for (const key in env) process.env[key] = String(env[key]);
	}
};
/**
* 直连模式的客户端（Unix Domain Socket 服务端，平台直连过来）
* 完全绕过主进程，延迟 ≈ 20μs
*/
const cbpClientDirect = (sockPath, open) => {
	createDirectServer(sockPath, (data) => {
		handleInboundMessage(data);
	}).then((channel) => {
		setDirectSend(channel.send);
		notifyTransportReady("direct");
		open();
		logger.debug({
			code: ResultCode.Ok,
			message: "客户端已启用直连通道模式（Unix Domain Socket）",
			data: null
		});
	}).catch((err) => {
		logger.error({
			code: ResultCode.Fail,
			message: "客户端直连通道建立失败，回退 fork IPC",
			data: err
		});
		cbpClientIPC(open);
	});
};
/**
* IPC 模式的客户端（fork IPC 通道，经主进程桥接）
*/
const cbpClientIPC = (open) => {
	process.on("message", (message) => {
		try {
			const msg = typeof message === "string" ? JSON.parse(message) : message;
			if (msg?.type === "ipc:data") handleInboundMessage(msg.data);
		} catch (error) {
			logger.error({
				code: ResultCode.Fail,
				message: "IPC 客户端解析消息失败",
				data: error
			});
		}
	});
	notifyTransportReady("ipc");
	open();
	logger.debug({
		code: ResultCode.Ok,
		message: "客户端已启用 IPC 极速通讯模式",
		data: null
	});
};
/**
* CBP 客户端（自动检测 直连 / IPC / WebSocket 模式）
* 优先级：直连通道 > fork IPC > WebSocket
* @param url
* @param options
*/
const cbpClient = (url, options = {}) => {
	const { open = () => {}, isFullReceive = true } = options;
	if (process.env.__ALEMON_DIRECT_SOCK && typeof process.send === "function") {
		cbpClientDirect(process.env.__ALEMON_DIRECT_SOCK, open);
		return;
	}
	if (process.env.__ALEMON_IPC === "1" && typeof process.send === "function") {
		cbpClientIPC(open);
		return;
	}
	createWSConnector({
		url,
		role: "client",
		globalKey: "chatbotClient",
		extraHeaders: { [FULL_RECEIVE_HEADER]: isFullReceive ? "1" : "0" },
		onOpen: () => {
			notifyTransportReady("ws");
			open();
		},
		onMessage: (messageStr) => {
			try {
				const parsedMessage = flattedJSON.parse(messageStr);
				handleInboundMessage(parsedMessage);
			} catch (error) {
				logger.error({
					code: ResultCode.Fail,
					message: "客户端解析消息失败",
					data: error
				});
			}
		}
	});
};

//#endregion
export { cbpClient };