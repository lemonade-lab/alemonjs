import { sanitizeForSerialization } from "../../common/utils.js";
import { isNormalizedActionRequest, isNormalizedApiRequest, normalizeInboundMessage, toLegacyActionData, toLegacyApiData } from "../../common/cbp/normalize.js";
import "../../common/index.js";
import { fullClient } from "../cbp/processor/config.js";
import { publishCBPFileEvent } from "../cbp/file-transport.js";
import * as flattedJSON from "flatted";
import { WebSocket } from "ws";

//#region src/core/process/ipc-bridge.ts
/**
* Publish CBP traffic to the process that owns AlemonJS, when it was started
* through child_process.fork().  This is deliberately independent from the
* internal platform/client IPC channel: a supervising process can observe
* login challenges without opening another WebSocket server.
*/
const notifyParentCBPEvent = (data) => {
	if (typeof process.send !== "function") return;
	try {
		process.send({
			type: "cbp.event",
			protocolVersion: "v1",
			data
		});
	} catch {}
};
let platformChild = null;
let clientChild = null;
/**
* 设置平台子进程引用
*/
const setPlatformChild = (child) => {
	platformChild = child;
};
/**
* 设置客户端子进程引用
*/
const setClientChild = (child) => {
	clientChild = child;
};
/**
* 获取平台子进程引用
*/
const getPlatformChild = () => platformChild;
/**
* 获取客户端子进程引用
*/
const getClientChild = () => clientChild;
/**
* Mirror platform traffic for an external supervisor without forwarding it to
* the module process. Direct-IPC has already delivered the event to that
* process, so forwarding it again would duplicate application handling.
*/
const observeFromPlatform = (data) => {
	const safeData = sanitizeForSerialization(data);
	notifyParentCBPEvent(safeData);
	publishCBPFileEvent(safeData);
};
/**
* 将消息从平台子进程转发到客户端子进程（同时转发到 WebSocket 前端客户端）
*/
const forwardFromPlatform = (data) => {
	const safeData = sanitizeForSerialization(data);
	observeFromPlatform(safeData);
	if (clientChild?.connected) clientChild.send({
		type: "ipc:data",
		data: safeData
	});
	else if (process.env.NODE_ENV === "development") logger.debug?.({
		message: "skip forwarding platform message before client transport ready",
		data: null
	});
	if (fullClient.size > 0) try {
		const messageStr = flattedJSON.stringify(safeData);
		fullClient.forEach((ws, id) => {
			if (ws.readyState === WebSocket.OPEN) ws.send(messageStr);
			else fullClient.delete(id);
		});
	} catch {}
};
/**
* 将消息从客户端子进程转发到平台子进程（sandbox 模式下同时转发到 testone）
*/
const forwardFromClient = (data) => {
	const safeData = sanitizeForSerialization(data);
	if (platformChild?.connected) platformChild.send({
		type: "ipc:data",
		data: safeData
	});
	else if (process.env.NODE_ENV === "development") logger.debug?.({
		message: "skip forwarding client message before platform transport ready",
		data: null
	});
	if (global.__sandbox && global.testoneClient) try {
		const normalized = normalizeInboundMessage(safeData);
		let outbound = safeData;
		if (isNormalizedActionRequest(normalized)) outbound = toLegacyActionData(normalized);
		else if (isNormalizedApiRequest(normalized)) outbound = toLegacyApiData(normalized);
		const messageStr = typeof outbound === "string" ? outbound : flattedJSON.stringify(outbound);
		if (global.testoneClient.readyState === WebSocket.OPEN) global.testoneClient.send(messageStr);
	} catch {}
};

//#endregion
export { forwardFromClient, forwardFromPlatform, getClientChild, getPlatformChild, notifyParentCBPEvent, observeFromPlatform, setClientChild, setPlatformChild };