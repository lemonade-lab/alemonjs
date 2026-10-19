import { runtimeExecution, runtimeNow, scopedMap } from "../common/runtime-scope.js";
import { showErrorModule } from "../common/utils.js";
import { activeContexts, clearActiveContexts, clearActiveContextsByApp, getActiveContextKeys, putActiveContext, removeActiveContext } from "./runtime/context-registry.js";
import { getChildrenApp } from "./runtime/store.js";
import { finishCurrentTrace, getCurrentAppName, getCurrentEvent, withEventContext } from "./runtime/hook-event-context.js";
import { dispatchEventError } from "./runtime/event-error.js";
import { scheduleCancel, scheduleTimeout } from "./runtime/schedule-store.js";

//#region src/application/context.ts
const contextQueues = scopedMap();
let contextSequence = 0;
const contextDefinitionSymbol = Symbol("alemonjs.contextDefinition");
const contextDefinitionSymbolForContent = Symbol("alemonjs.contextDefinitionForContent");
const parseExpiresIn = (value) => {
	if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
	if (typeof value !== "string") return;
	const match = /^(\d+)\s*(ms|s|m|h|d)?$/i.exec(value.trim());
	if (!match) throw new Error(`Invalid context expiresIn: ${value}`);
	const amount = Number(match[1]);
	const unit = match[2]?.toLowerCase() ?? "ms";
	return amount * (unit === "d" ? 864e5 : unit === "h" ? 36e5 : unit === "m" ? 6e4 : unit === "s" ? 1e3 : 1);
};
const cloneState = (state) => {
	if (!state || typeof state !== "object" || Array.isArray(state)) throw new Error("Context initialState must be an object");
	try {
		return globalThis.structuredClone(state);
	} catch {
		throw new Error("Context initialState must be structured-cloneable");
	}
};
const clonePayload = (payload) => {
	try {
		return globalThis.structuredClone(payload);
	} catch {
		throw new Error("Context payload must be structured-cloneable");
	}
};
const getScopeKey = (appName, definition, event) => {
	const values = definition.scope.map((key) => {
		const value = event[key];
		if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") throw new Error(`Invalid context scope value: ${key} must be a string, number or boolean`);
		return [key, String(value)];
	});
	return JSON.stringify([
		appName,
		definition.name,
		values
	]);
};
const isExpired = (context, now = runtimeNow()) => context.expiresAt !== void 0 && context.expiresAt <= now;
/**
* Creates the context configuration consumed by defineChildren().register().
* The wrapper leaves room for future context-level options without changing
* the responseContent registration shape.
*/
const configureContext = (config) => {
	const contexts = Object.values(config.contexts ?? {});
	const names = /* @__PURE__ */ new Set();
	if (contexts.length === 0) throw new Error("configureContext requires at least one context");
	for (const context of contexts) {
		const definition = context[contextDefinitionSymbolForContent];
		if (!definition) throw new Error("configureContext only accepts contexts created by createContext");
		if (names.has(definition.name)) throw new Error(`Duplicate context name: ${definition.name}`);
		names.add(definition.name);
	}
	return Object.freeze({
		...config,
		contexts: Object.freeze({ ...config.contexts })
	});
};
/**
* Creates a statically registered, event-driven context.
* Calling one of its handlers only opens a context; handlers run on later events.
*/
const createContext = (config) => {
	if (!config.name) throw new Error("Context name is required");
	if (config.events.length === 0) throw new Error(`Context events are required: ${config.name}`);
	if (config.scope.length === 0) throw new Error(`Context scope is required: ${config.name}`);
	if (Object.keys(config.handlers).length === 0) throw new Error(`Context handlers are required: ${config.name}`);
	if (Object.prototype.hasOwnProperty.call(config.handlers, "cancel")) throw new Error(`Context handler name is reserved: ${config.name}/cancel`);
	const initialState = typeof config.initialState === "function" ? config.initialState : cloneState(config.initialState);
	const definition = {
		name: config.name,
		events: Object.freeze([...config.events]),
		scope: Object.freeze([...config.scope]),
		conflict: config.conflict ?? "replace",
		onError: config.onError ?? "close",
		expiresIn: parseExpiresIn(config.expiresIn),
		initialState: (payload) => {
			const state = typeof initialState === "function" ? initialState(payload) : initialState;
			return cloneState(state);
		},
		handlers: Object.freeze({ ...config.handlers })
	};
	const actions = Object.fromEntries(Object.keys(config.handlers).map((handler) => [handler, (payload) => {
		const action = {
			type: `${config.name}/${handler}`,
			payload
		};
		Object.defineProperty(action, contextDefinitionSymbol, { value: {
			definition,
			handler
		} });
		dispatchContext(action);
	}]));
	const context = {
		name: config.name,
		...actions,
		cancel: () => cancelContext(definition)
	};
	Object.defineProperty(context, contextDefinitionSymbolForContent, { value: definition });
	return Object.freeze(context);
};
const getRegisteredContexts = (appName, phase) => {
	const register = getChildrenApp(appName)?.register;
	const content = phase === "middleware" ? register?.middlewareContent : register?.responseContent;
	return content ? Object.values(content.contexts) : [];
};
const getContextPhases = (appName, definition) => {
	return ["middleware", "response"].filter((phase) => {
		return getRegisteredContexts(appName, phase).some((context) => context[contextDefinitionSymbolForContent] === definition);
	});
};
const isRegistered = (appName, definition, phase) => {
	const phases = getContextPhases(appName, definition);
	return phase ? phases.includes(phase) : phases.length > 0;
};
/** Validates phase ownership before an application registration is mounted. */
const validateContextRegistration = (register) => {
	const owners = /* @__PURE__ */ new Map();
	for (const phase of ["middleware", "response"]) {
		const content = phase === "middleware" ? register?.middlewareContent : register?.responseContent;
		for (const context of content ? Object.values(content.contexts) : []) {
			const definition = context[contextDefinitionSymbolForContent];
			if (!definition) throw new Error("Context registration only accepts contexts created by createContext");
			if (owners.has(definition)) throw new Error(`Context cannot be registered in multiple phases: ${definition.name}`);
			owners.set(definition, phase);
		}
	}
};
/** Ends this context for the current event scope. */
const cancelContext = (definition) => {
	const event = getCurrentEvent();
	if (!event || typeof event !== "object") throw new Error("Context actions must be called inside an event handler");
	const appName = getCurrentAppName() ?? "main";
	const key = getScopeKey(appName, definition, event);
	return removeActiveContext(key);
};
/** Opens a context for the current event. It never invokes a handler immediately. */
const dispatchContext = (action, event) => {
	const metadata = action[contextDefinitionSymbol];
	const definition = metadata?.definition;
	if (!definition) throw new Error(`Invalid context action: ${action.type}`);
	const handler = metadata.handler;
	const currentEvent = event ?? getCurrentEvent();
	if (!currentEvent || typeof currentEvent !== "object") throw new Error("Context actions must be dispatched with an event or inside an event handler");
	const appName = getCurrentAppName() ?? "main";
	const phases = getContextPhases(appName, definition);
	if (phases.length === 0) throw new Error(`Context action is not registered for app: ${action.type}`);
	if (phases.length > 1) throw new Error(`Context is registered in multiple phases: ${action.type}`);
	const key = getScopeKey(appName, definition, currentEvent);
	if (activeContexts.get(key) && definition.conflict === "reject") throw new Error(`Context is already active: ${action.type}`);
	const now = runtimeNow();
	const id = `${now.toString(36)}-${Math.random().toString(36).slice(2)}`;
	const payload = clonePayload(action.payload);
	const expiresAt = definition.expiresIn ? now + definition.expiresIn : void 0;
	const controller = new AbortController();
	let expirationTimerId;
	const context = {
		key,
		id,
		appName,
		phase: phases[0],
		events: definition.events,
		definition,
		handler,
		payload,
		state: definition.initialState(payload),
		expiresAt,
		createdAt: now,
		order: ++contextSequence,
		controller,
		onRemove: () => {
			controller.abort();
			if (expirationTimerId) scheduleCancel(expirationTimerId);
		}
	};
	if (definition.expiresIn) expirationTimerId = scheduleTimeout(() => {
		removeActiveContext(key, id);
	}, definition.expiresIn, appName);
	putActiveContext(context);
};
/**
* Runs a matching active context. `true` means the event was claimed, even when
* it was explicitly passed on to the normal router.
*/
const expendContext = async (event, select, next, phase) => {
	const now = runtimeNow();
	let current;
	for (const key of getActiveContextKeys(select)) {
		const context = activeContexts.get(key);
		if (!context) continue;
		if (context.phase !== phase) continue;
		if (isExpired(context, now)) {
			removeActiveContext(key, context.id);
			continue;
		}
		if (!isRegistered(context.appName, context.definition, context.phase)) {
			removeActiveContext(key, context.id);
			continue;
		}
		let scopeKey;
		try {
			scopeKey = getScopeKey(context.appName, context.definition, event);
		} catch {
			continue;
		}
		if (scopeKey === key && (!current || context.order > current.order)) current = context;
	}
	if (!current) {
		next();
		return false;
	}
	const execution = runtimeExecution.getStore();
	if (execution) execution.contextClaimed = true;
	const key = current.key;
	const run = (contextQueues.get(key) ?? Promise.resolve()).catch(() => void 0).then(async () => {
		const active = activeContexts.get(key);
		if (!active) {
			next();
			return;
		}
		const handler = active.definition.handlers[active.handler];
		if (!handler) {
			removeActiveContext(active.key, active.id);
			next();
			return;
		}
		let shouldPass = false;
		let shouldClose = false;
		const control = {
			payload: active.payload,
			signal: active.controller.signal,
			pass: () => {
				shouldPass = true;
			},
			close: () => {
				shouldClose = true;
			}
		};
		try {
			await withEventContext(event, () => control.pass(), () => handler(event, active.state, control), {
				appName: active.appName,
				phase: active.phase === "middleware" ? "middleware-content" : "response-content"
			});
		} catch (error) {
			showErrorModule(error instanceof Error ? error : new Error(typeof error === "string" ? error : "Context handler failed"));
			const shouldContinue = await dispatchEventError({
				event,
				error,
				appName: active.appName,
				phase: active.phase === "middleware" ? "middleware-content" : "response-content"
			});
			if (active.definition.onError === "close") removeActiveContext(active.key, active.id);
			if (shouldContinue) {
				next();
				return;
			}
			finishCurrentTrace("error");
			return;
		}
		if (shouldClose) removeActiveContext(active.key, active.id);
		if (shouldPass) next();
		else finishCurrentTrace("consumed");
	}).finally(() => {
		if (contextQueues.get(key) === run) contextQueues.delete(key);
	});
	contextQueues.set(key, run);
	await run;
	return true;
};
/** Test and lifecycle utility for clearing in-memory active contexts. */
const clearContexts = () => {
	clearActiveContexts();
	contextQueues.clear();
};
/** Clears every active context owned by an unloaded application. */
const clearContextsByApp = (appName) => {
	clearActiveContextsByApp(appName);
};

//#endregion
export { clearContexts, clearContextsByApp, configureContext, createContext, expendContext, validateContextRegistration };