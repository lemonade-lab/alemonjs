import { randomUUID } from "node:crypto";

//#region src/common/cbp/runtime.ts
const deviceId = randomUUID();
let idCounter = 0;
const idPrefix = process.pid.toString(36) + Date.now().toString(36);
const generateUniqueId = () => {
	return idPrefix + (++idCounter).toString(36);
};

//#endregion
export { deviceId, generateUniqueId };