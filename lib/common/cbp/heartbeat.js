import { logger } from "../logger.js";
import { ResultCode } from "../variable.js";
import { HEARTBEAT_INTERVAL } from "./constants.js";

//#region src/common/cbp/heartbeat.ts
const useHeartbeat = ({ ping, isConnected, terminate }) => {
	let heartbeatTimer = null;
	let lastPong = Date.now();
	const stopHeartbeat = () => {
		if (heartbeatTimer) {
			clearInterval(heartbeatTimer);
			heartbeatTimer = null;
		}
	};
	const callback = () => {
		if (isConnected()) {
			if (Date.now() - lastPong > 18e3 * 2) {
				logger.debug({
					code: ResultCode.Fail,
					message: "心跳超时，断开重连",
					data: null
				});
				terminate();
				return;
			}
			ping();
			logger.debug({
				code: ResultCode.Ok,
				message: "发送 ping",
				data: null
			});
			heartbeatTimer = setTimeout(callback, HEARTBEAT_INTERVAL);
		} else {
			stopHeartbeat();
			terminate();
		}
	};
	const startHeartbeat = () => {
		lastPong = Date.now();
		stopHeartbeat();
		callback();
	};
	return [{
		start: startHeartbeat,
		stop: stopHeartbeat,
		pong: () => {
			lastPong = Date.now();
			logger.debug({
				code: ResultCode.Ok,
				message: "收到 pong",
				data: null
			});
		}
	}];
};

//#endregion
export { useHeartbeat };