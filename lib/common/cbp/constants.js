//#region src/common/cbp/constants.ts
const USER_AGENT_HEADER = "user-agent";
const USER_AGENT_HEADER_VALUE_MAP = {
	platform: "platform",
	client: "client",
	testone: "testone"
};
const DEVICE_ID_HEADER = "x-device-id";
const FULL_RECEIVE_HEADER = "x-full-receive";
const timeoutTime = 18e4;
const reconnectInterval = 6e3;
const HEARTBEAT_INTERVAL = 18e3;

//#endregion
export { DEVICE_ID_HEADER, FULL_RECEIVE_HEADER, HEARTBEAT_INTERVAL, USER_AGENT_HEADER, USER_AGENT_HEADER_VALUE_MAP, reconnectInterval, timeoutTime };