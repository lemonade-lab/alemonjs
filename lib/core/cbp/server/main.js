import { ResultCode } from "../../../common/variable.js";
import { DEVICE_ID_HEADER, FULL_RECEIVE_HEADER, USER_AGENT_HEADER, USER_AGENT_HEADER_VALUE_MAP } from "../../../common/cbp/constants.js";
import { getNormalizedDeviceId, getNormalizedEventRouteId, isNormalizedActionRequest, isNormalizedApiRequest, normalizeInboundMessage, toLegacyActionData, toLegacyApiData } from "../../../common/cbp/normalize.js";
import "../../../common/index.js";
import router from "../routers/router.js";
import { bindChannelToClient, childrenBind, childrenClient, clientBindCount, fullClient, platformClient, unbindClient } from "../processor/config.js";
import { createTestOneController } from "./testone.js";
import { publishCBPFileEvent } from "../file-transport.js";
import { forwardFromClient, getClientChild, notifyParentCBPEvent } from "../../process/ipc-bridge.js";
import * as flattedJSON from "flatted";
import { WebSocket, WebSocketServer } from "ws";
import Koa from "koa";
import koaCors from "@koa/cors";

//#region src/core/cbp/server/main.ts
const stringifyForSocket = (payload) => {
	return flattedJSON.stringify(payload);
};
/**
* Forward a request from an external CBP client (for example a Go control process).
* In WebSocket-platform mode this targets the platform socket; in fork mode it crosses
* the main-process IPC bridge to the platform child.
*/
const forwardExternalRequestToPlatform = (message) => {
	if (platformClient.size > 0) {
		platformClient.forEach((platformWs, platformId) => {
			if (platformWs.readyState === WebSocket.OPEN) platformWs.send(message);
			else platformClient.delete(platformId);
		});
		return;
	}
	try {
		forwardFromClient(flattedJSON.parse(message));
	} catch {}
};
const normalizeTestOneOutboundMessage = (message) => {
	try {
		const inbound = flattedJSON.parse(String(message));
		const normalized = normalizeInboundMessage(inbound);
		if (isNormalizedActionRequest(normalized)) return stringifyForSocket(toLegacyActionData(normalized));
		if (isNormalizedApiRequest(normalized)) return stringifyForSocket(toLegacyApiData(normalized));
	} catch {}
	return message.toString();
};
const routeNormalizedMessage = (message, input) => {
	const normalized = normalizeInboundMessage(input);
	if (!normalized) return {
		normalized: null,
		handled: false
	};
	if (normalized.kind === "api.res" || normalized.kind === "action.res") {
		const resolvedDeviceId = getNormalizedDeviceId(normalized);
		if (resolvedDeviceId) routeMessageToDevice(resolvedDeviceId, message);
		return {
			normalized,
			handled: true
		};
	}
	if (normalized.kind === "event") {
		const routeId = getNormalizedEventRouteId(normalized);
		handleEvent(message, routeId || "");
		return {
			normalized,
			handled: true
		};
	}
	return {
		normalized,
		handled: false
	};
};
const routeMessageToDevice = (DeviceId, message) => {
	if (childrenClient.has(DeviceId)) {
		const clientWs = childrenClient.get(DeviceId);
		if (clientWs?.readyState === WebSocket.OPEN) clientWs.send(message);
		else childrenClient.delete(DeviceId);
	} else if (fullClient.has(DeviceId)) {
		const clientWs = fullClient.get(DeviceId);
		if (clientWs?.readyState === WebSocket.OPEN) clientWs.send(message);
		else fullClient.delete(DeviceId);
	} else {
		const clientChild = getClientChild();
		if (clientChild?.connected) try {
			const parsed = flattedJSON.parse(String(message));
			clientChild.send({
				type: "ipc:data",
				data: parsed
			});
		} catch {}
	}
};
const handleEvent = (message, ID) => {
	try {
		const event = flattedJSON.parse(String(message));
		notifyParentCBPEvent(event);
		publishCBPFileEvent(event);
	} catch {}
	const clientChild = getClientChild();
	if (clientChild?.connected) try {
		const parsed = flattedJSON.parse(String(message));
		clientChild.send({
			type: "ipc:data",
			data: parsed
		});
	} catch {}
	fullClient.forEach((clientWs, clientId) => {
		if (clientWs.readyState === WebSocket.OPEN) clientWs.send(message);
		else fullClient.delete(clientId);
	});
	if (!ID) {
		logger.error({
			code: ResultCode.Fail,
			message: "消息缺少标识符 ID",
			data: null
		});
		return;
	}
	const reBind = () => {
		if (childrenClient.size === 0) return;
		else if (childrenClient.size === 1) {
			const [bindId, clientWs] = childrenClient.entries().next().value;
			bindChannelToClient(ID, bindId);
			clientWs.send(message);
			return;
		}
		let minCount = Infinity;
		let bindId = null;
		childrenClient.forEach((_, id) => {
			const count = clientBindCount.get(id) ?? 0;
			if (count < minCount) {
				minCount = count;
				bindId = id;
			}
		});
		if (bindId) {
			const clientWs = childrenClient.get(bindId);
			if (clientWs?.readyState === WebSocket.OPEN) {
				bindChannelToClient(ID, bindId);
				clientWs.send(message);
			} else {
				childrenClient.delete(bindId);
				unbindClient(bindId);
				reBind();
			}
		} else logger.error({
			code: ResultCode.Fail,
			message: "服务端出现意外，无法绑定客户端",
			data: null
		});
	};
	if (!childrenBind.has(ID)) {
		reBind();
		return;
	}
	const bindId = childrenBind.get(ID);
	if (!childrenClient.has(bindId)) {
		reBind();
		return;
	}
	const clientWs = childrenClient.get(bindId);
	if (clientWs?.readyState !== WebSocket.OPEN) {
		childrenClient.delete(bindId);
		reBind();
		return;
	}
	clientWs.send(message);
};
const setChildrenClient = (originId, ws) => {
	childrenClient.set(originId, ws);
	ws.on("message", (message) => {
		if (global.__sandbox) {
			if (global.testoneClient?.readyState === WebSocket.OPEN) global.testoneClient.send(normalizeTestOneOutboundMessage(message.toString()));
			return;
		}
		forwardExternalRequestToPlatform(message.toString());
	});
	ws.on("close", () => {
		childrenClient.delete(originId);
		unbindClient(originId);
		logger.debug({
			code: ResultCode.Fail,
			message: `Client ${originId} disconnected`,
			data: null
		});
	});
	ws.on("error", (err) => {
		logger.error({
			code: ResultCode.Fail,
			message: `Client ${originId} error`,
			data: err
		});
	});
};
const setFullClient = (originId, ws) => {
	fullClient.set(originId, ws);
	ws.on("message", (message) => {
		if (global.__sandbox) {
			if (global.testoneClient?.readyState === WebSocket.OPEN) global.testoneClient.send(normalizeTestOneOutboundMessage(message.toString()));
			return;
		}
		forwardExternalRequestToPlatform(message.toString());
	});
	ws.on("close", () => {
		fullClient.delete(originId);
		logger.debug({
			code: ResultCode.Fail,
			message: `Client ${originId} disconnected`,
			data: null
		});
	});
};
/**
* @param originId
* @param ws
*/
const setPlatformClient = (originId, ws) => {
	if (platformClient.size > 0) {
		logger.error({
			code: ResultCode.Fail,
			message: `平台连接已存在: ${originId}`,
			data: null
		});
		ws.close();
		return;
	}
	platformClient.set(originId, ws);
	ws.on("message", (message) => {
		try {
			const inbound = flattedJSON.parse(message.toString());
			routeNormalizedMessage(message.toString(), inbound);
			logger.debug({
				code: ResultCode.Ok,
				message: "服务端接收到消息",
				data: inbound
			});
		} catch (error) {
			logger.error({
				code: ResultCode.Fail,
				message: "服务端解析平台消息失败",
				data: error
			});
		}
	});
	ws.on("close", () => {
		platformClient.delete(originId);
		logger.debug({
			code: ResultCode.Fail,
			message: `Client ${originId} disconnected`,
			data: null
		});
	});
	ws.on("error", (err) => {
		logger.error({
			code: ResultCode.Fail,
			message: `Client ${originId} error`,
			data: err
		});
	});
};
/**
* @param originId
* @param ws
*/
const setTestOnePlatformClient = (ws) => {
	if (global.testoneClient) delete global.testoneClient;
	global.testoneClient = ws;
	const controller = createTestOneController(ws, null);
	ws.on("message", (message) => {
		try {
			const inbound = flattedJSON.parse(message.toString());
			const { handled } = routeNormalizedMessage(message.toString(), inbound);
			logger.debug({
				code: ResultCode.Ok,
				message: "测试端接收到消息",
				data: inbound
			});
			if (!handled) controller.onMessage(inbound);
		} catch (error) {
			logger.error({
				code: ResultCode.Fail,
				message: "测试端解析平台消息失败",
				data: error
			});
		}
	});
	ws.on("close", () => {
		controller.close();
	});
	ws.on("error", (err) => {
		controller.error(err);
	});
};
/**
* CBP 服务器
* @param port
* @param listeningListener
*/
const cbpServer = (port, listeningListener, autoPort = false) => {
	if (global.chatbotServer) delete global.chatbotServer;
	let count = 0;
	let currentPort = port;
	/**
	* 获取重连时间
	* @returns
	*/
	const getReConnectTime = () => {
		count++;
		let curTime = count > 6 ? 1e3 * count * 2 : count > 3 ? 6e3 : 1e3;
		if (curTime >= 6e5) curTime = 6e5;
		const mTime = (curTime / 1e3 / 60).toFixed(2);
		logger.info(`[alemonjs][CBP Server] 第 ${count} 次重连，等待 ${mTime} 分钟后重新连接`);
		return curTime;
	};
	/**
	* 创建服务器
	* @returns
	*/
	const createServer = () => {
		try {
			const app = new Koa();
			app.use(router.routes());
			app.use(router.allowedMethods());
			app.use(koaCors({
				origin: "*",
				allowMethods: [
					"GET",
					"POST",
					"PUT",
					"DELETE"
				]
			}));
			const server = app.listen(currentPort, () => listeningListener?.(currentPort));
			global.chatbotServer = new WebSocketServer({ server });
			global.chatbotServer.on("connection", (ws, request) => {
				if (request.url === "/testone") {
					if (!global.__sandbox) {
						ws.close(4e3, "Sandbox mode required");
						return;
					}
					setTestOnePlatformClient(ws);
					return;
				}
				const headers = request.headers;
				const origin = headers["user-agent"] || USER_AGENT_HEADER_VALUE_MAP.client;
				const originId = headers[DEVICE_ID_HEADER];
				if (!originId) {
					ws.close(4e3, "Missing Device ID");
					return;
				}
				logger.debug({
					code: ResultCode.Ok,
					message: `Client ${originId} connected`,
					data: null
				});
				if (origin === USER_AGENT_HEADER_VALUE_MAP.platform) {
					setPlatformClient(originId, ws);
					return;
				} else if (origin === USER_AGENT_HEADER_VALUE_MAP.client) ws.send(flattedJSON.stringify({
					active: "sync",
					payload: { env: {
						login: process.env.login,
						platform: process.env.platform
					} },
					activeId: originId
				}));
				if (headers["x-full-receive"] === "1") {
					setFullClient(originId, ws);
					return;
				}
				setChildrenClient(originId, ws);
			});
			chatbotServer.on("error", (err) => {
				platformClient.clear();
				childrenClient.clear();
				fullClient.clear();
				childrenBind.clear();
				clientBindCount.clear();
				delete global.testoneClient;
				if (err.code === "EADDRINUSE") {
					logger.error({
						code: ResultCode.FailInternal,
						message: autoPort ? `端口 ${currentPort} 已被占用，尝试使用端口 ${currentPort + 1}` : `端口 ${currentPort} 已被占用，请检查是否有其他服务在运行`,
						data: err.message
					});
					const reCreateTime = autoPort ? 0 : getReConnectTime();
					if (autoPort) currentPort++;
					setTimeout(() => {
						createServer();
					}, reCreateTime);
				} else logger.error({
					code: ResultCode.FailInternal,
					message: "WebSocket server error",
					data: err.message || "Unknown error"
				});
			});
			chatbotServer.on("close", () => {
				logger.warn({
					code: ResultCode.Ok,
					message: "WebSocket server closed",
					data: null
				});
				platformClient.clear();
				childrenClient.clear();
				fullClient.clear();
				childrenBind.clear();
				clientBindCount.clear();
			});
		} catch (error) {
			logger.error({
				code: ResultCode.FailInternal,
				message: "创建 CBP 服务器失败",
				data: error
			});
		}
	};
	createServer();
};

//#endregion
export { cbpServer };