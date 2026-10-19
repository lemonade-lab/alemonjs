//#region src/core/cbp/processor/config.ts
const childrenClient = /* @__PURE__ */ new Map();
const platformClient = /* @__PURE__ */ new Map();
const fullClient = /* @__PURE__ */ new Map();
const childrenBind = /* @__PURE__ */ new Map();
const clientBindCount = /* @__PURE__ */ new Map();
/**
* 绑定频道/群到客户端（同步维护计数器）
*/
const bindChannelToClient = (channelId, clientId) => {
	const oldClientId = childrenBind.get(channelId);
	if (oldClientId && oldClientId !== clientId) {
		const oldCount = clientBindCount.get(oldClientId) ?? 0;
		if (oldCount > 1) clientBindCount.set(oldClientId, oldCount - 1);
		else clientBindCount.delete(oldClientId);
	}
	childrenBind.set(channelId, clientId);
	clientBindCount.set(clientId, (clientBindCount.get(clientId) ?? 0) + 1);
};
/**
* 清理指定客户端的所有绑定记录（客户端断开时调用）
*/
const unbindClient = (clientId) => {
	for (const [channelId, boundClientId] of childrenBind.entries()) if (boundClientId === clientId) childrenBind.delete(channelId);
	clientBindCount.delete(clientId);
};

//#endregion
export { bindChannelToClient, childrenBind, childrenClient, clientBindCount, fullClient, platformClient, unbindClient };