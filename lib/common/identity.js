import { getConfigValue } from "./config.js";

//#region src/common/identity.ts
const matchIn = (source, key) => {
	if (Array.isArray(source)) return source.includes(key);
	if (source && typeof source === "object") return Object.prototype.hasOwnProperty.call(source, key) && !!source[key];
	return false;
};
const fastHash = (str) => {
	let hash = 2166136261;
	for (let i = 0; i < str.length; i++) {
		hash ^= str.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0).toString(36);
};
const createUserHashKey = (event) => {
	return fastHash(`${event.Platform}:${event.UserId}`);
};
/**
* @deprecated 已废弃，请直接使用 useUserHashKey
*/
const useUserHashKey = createUserHashKey;
const isMaster = (UserId, platform) => {
	const values = getConfigValue() || {};
	const value = values[platform] && typeof values[platform] === "object" ? values[platform] : {};
	const UserKey = createUserHashKey({
		Platform: platform,
		UserId
	});
	return matchIn(values.master_key, UserKey) || matchIn(values.master_id, UserId) || matchIn(value.master_key, UserKey) || matchIn(value.master_id, UserId);
};

//#endregion
export { createUserHashKey, fastHash, isMaster, matchIn, useUserHashKey };