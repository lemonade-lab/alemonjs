//#region src/common/cbp/normalize.ts
const now = () => Date.now();
const asRecord = (value) => {
	return value && typeof value === "object" && !Array.isArray(value) ? value : {};
};
const asResults = (value) => {
	return Array.isArray(value) ? value : [];
};
const inferEventRouteId = (event) => {
	const channelId = event.ChannelId;
	const guildId = event.GuildId;
	const deviceId = event.DeviceId;
	if (typeof channelId === "string" && channelId) return channelId;
	if (typeof guildId === "string" && guildId) return guildId;
	if (typeof deviceId === "string" && deviceId) return deviceId;
};
const createRequestEnvelope = (type, id, deviceId, payload) => {
	return {
		protocol: "cbp",
		version: 1,
		type,
		id,
		timestamp: now(),
		source: {
			role: "app-client",
			deviceId
		},
		payload
	};
};
const createResponseEnvelope = (type, replyTo, deviceId, payload, error) => {
	return {
		protocol: "cbp",
		version: 1,
		type,
		id: `${replyTo}:res`,
		replyTo,
		timestamp: now(),
		source: {
			role: "platform",
			deviceId
		},
		target: {
			role: "app-client",
			deviceId
		},
		payload: { results: payload },
		error
	};
};
const normalizeEnvelopeMessage = (input) => {
	const payload = input.payload;
	const meta = asRecord(input.meta);
	const deviceId = input.source?.deviceId ?? input.target?.deviceId;
	const sourceRole = input.source?.role;
	const targetRole = input.target?.role;
	switch (input.type) {
		case "event": {
			const eventPayload = asRecord(payload);
			const event = asRecord(eventPayload.event);
			return {
				kind: "event",
				id: input.id,
				timestamp: input.timestamp,
				deviceId,
				sourceRole,
				targetRole,
				eventName: String(eventPayload.name ?? ""),
				event,
				raw: eventPayload.raw,
				meta
			};
		}
		case "action.req": {
			const actionPayload = asRecord(payload);
			return {
				kind: "action.req",
				id: input.id,
				timestamp: input.timestamp,
				deviceId,
				sourceRole,
				targetRole,
				action: String(actionPayload.action ?? ""),
				input: asRecord(actionPayload.input),
				meta
			};
		}
		case "action.res": return {
			kind: "action.res",
			id: input.id,
			replyTo: String(input.replyTo ?? ""),
			timestamp: input.timestamp,
			deviceId,
			sourceRole,
			targetRole,
			results: asResults(asRecord(payload).results),
			error: input.error,
			meta
		};
		case "api.req": {
			const apiPayload = asRecord(payload);
			return {
				kind: "api.req",
				id: input.id,
				timestamp: input.timestamp,
				deviceId,
				sourceRole,
				targetRole,
				api: String(apiPayload.api ?? ""),
				input: asRecord(apiPayload.input),
				meta
			};
		}
		case "api.res": return {
			kind: "api.res",
			id: input.id,
			replyTo: String(input.replyTo ?? ""),
			timestamp: input.timestamp,
			deviceId,
			sourceRole,
			targetRole,
			results: asResults(asRecord(payload).results),
			error: input.error,
			meta
		};
		case "control": {
			const controlPayload = asRecord(payload);
			return {
				kind: "control",
				id: input.id,
				timestamp: input.timestamp,
				deviceId,
				sourceRole,
				targetRole,
				op: String(controlPayload.op ?? "error"),
				payload: controlPayload,
				error: input.error,
				meta
			};
		}
		default: return null;
	}
};
const normalizeLegacyMessage = (input) => {
	if (input?.apiId) {
		if (Array.isArray(input.payload)) return {
			kind: "api.res",
			id: String(input.apiId),
			replyTo: String(input.apiId),
			timestamp: now(),
			deviceId: typeof input.DeviceId === "string" ? input.DeviceId : void 0,
			results: input.payload,
			meta: {}
		};
		return {
			kind: "api.req",
			id: String(input.apiId),
			timestamp: now(),
			deviceId: typeof input.DeviceId === "string" ? input.DeviceId : void 0,
			api: typeof input.action === "string" ? input.action : "",
			input: asRecord(input.payload),
			meta: {}
		};
	}
	if (input?.actionId) {
		if (Array.isArray(input.payload)) return {
			kind: "action.res",
			id: String(input.actionId),
			replyTo: String(input.actionId),
			timestamp: now(),
			deviceId: typeof input.DeviceId === "string" ? input.DeviceId : void 0,
			results: input.payload,
			meta: {}
		};
		return {
			kind: "action.req",
			id: String(input.actionId),
			timestamp: now(),
			deviceId: typeof input.DeviceId === "string" ? input.DeviceId : void 0,
			action: typeof input.action === "string" ? input.action : "",
			input: asRecord(input.payload),
			meta: {}
		};
	}
	if (input?.activeId && input?.active === "sync") {
		const payload = asRecord(input.payload);
		return {
			kind: "control",
			id: String(input.activeId),
			timestamp: now(),
			deviceId: typeof input.DeviceId === "string" ? input.DeviceId : void 0,
			op: "sync",
			payload,
			meta: {}
		};
	}
	if (input?.name) {
		const event = input;
		return {
			kind: "event",
			id: typeof input.MessageId === "string" ? input.MessageId : typeof input.DeviceId === "string" ? input.DeviceId : `${input.name}:${now()}`,
			timestamp: typeof input.CreateAt === "number" ? input.CreateAt : now(),
			deviceId: typeof input.DeviceId === "string" ? input.DeviceId : void 0,
			eventName: input.name,
			event,
			raw: input.value,
			meta: {}
		};
	}
	return null;
};
const isCBPEnvelope = (input) => {
	if (!input || typeof input !== "object") return false;
	const value = input;
	return value.protocol === "cbp" && value.version === 1 && typeof value.type === "string" && typeof value.id === "string";
};
const normalizeInboundMessage = (input) => {
	if (!input || typeof input !== "object") return null;
	if (isCBPEnvelope(input)) return normalizeEnvelopeMessage(input);
	return normalizeLegacyMessage(input);
};
const toLegacyActionData = (message) => {
	return {
		action: message.action,
		payload: message.input,
		actionId: message.id,
		DeviceId: message.deviceId
	};
};
const toLegacyApiData = (message) => {
	const input = message.input;
	const key = typeof input.key === "string" ? input.key : "";
	const params = Array.isArray(input.params) ? input.params : [];
	return {
		action: message.api,
		payload: {
			event: input.event,
			key,
			params
		},
		apiId: message.id,
		DeviceId: message.deviceId
	};
};
const isNormalizedActionRequest = (message) => {
	return message?.kind === "action.req";
};
const isNormalizedApiRequest = (message) => {
	return message?.kind === "api.req";
};
const getNormalizedDeviceId = (message) => {
	return message.deviceId;
};
const getNormalizedEventRouteId = (message) => {
	if (message.kind !== "event") return;
	return inferEventRouteId(message.event);
};
const createActionRequestEnvelope = (data) => {
	return createRequestEnvelope("action.req", String(data.actionId ?? ""), data.DeviceId, {
		action: data.action,
		input: asRecord(data.payload)
	});
};
const createApiRequestEnvelope = (data) => {
	return createRequestEnvelope("api.req", String(data.apiId ?? ""), data.DeviceId, {
		api: data.action,
		input: asRecord(data.payload)
	});
};
const createActionResponseEnvelope = (data, payload, error) => {
	return createResponseEnvelope("action.res", String(data.actionId ?? ""), data.DeviceId, payload, error);
};
const createApiResponseEnvelope = (data, payload, error) => {
	return createResponseEnvelope("api.res", String(data.apiId ?? ""), data.DeviceId, payload, error);
};
const createEventEnvelope = (data) => {
	const deviceId = typeof data.DeviceId === "string" ? data.DeviceId : void 0;
	const eventName = typeof data.name === "string" ? data.name : "";
	const event = { ...data };
	return {
		protocol: "cbp",
		version: 1,
		type: "event",
		id: typeof data.MessageId === "string" ? data.MessageId : typeof deviceId === "string" ? `${deviceId}:${now()}` : `${eventName}:${now()}`,
		timestamp: typeof data.CreateAt === "number" ? data.CreateAt : now(),
		source: {
			role: "platform",
			deviceId
		},
		payload: {
			name: eventName,
			event,
			raw: data.value
		},
		meta: { routeId: inferEventRouteId(event) }
	};
};

//#endregion
export { createActionRequestEnvelope, createActionResponseEnvelope, createApiRequestEnvelope, createApiResponseEnvelope, createEventEnvelope, getNormalizedDeviceId, getNormalizedEventRouteId, isCBPEnvelope, isNormalizedActionRequest, isNormalizedApiRequest, normalizeInboundMessage, toLegacyActionData, toLegacyApiData };