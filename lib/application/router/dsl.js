import { translate } from "../../common/i18n.js";
import { defineRouter } from "../define-router.js";
import { Format } from "../format/message-format.js";
import { useMessage } from "../hooks/message.js";
import "../hooks/index.js";
import { normalizeRoutePath, parseMessageText } from "./parser.js";
import { checkFallbackHint } from "./fallback.js";
import { validateRouteArgsForCommand } from "./validator.js";

//#region src/application/router/dsl.ts
function normalizePathCondition(path) {
	if (path === void 0) return;
	return normalizeRoutePath(path);
}
function mergeConditions(parent, current) {
	const parentPath = normalizePathCondition(parent.path);
	const currentPath = normalizePathCondition(current.path);
	let path;
	if (currentPath !== void 0) path = parentPath ? normalizeRoutePath(`${parentPath} ${currentPath}`) : currentPath;
	else path = parentPath;
	return {
		path,
		events: current.events ?? parent.events,
		platforms: current.platforms ?? parent.platforms,
		routeText: current.routeText ?? parent.routeText,
		keyPolicy: current.keyPolicy ?? parent.keyPolicy,
		duplicateKey: current.duplicateKey ?? parent.duplicateKey,
		fallback: current.fallback ?? parent.fallback,
		redispatch: current.redispatch ?? parent.redispatch
	};
}
function normalizeRouteConfig(config) {
	if (typeof config === "string") return { path: normalizeRoutePath(config) };
	const path = config.path;
	if (!path) throw new Error("route path is required");
	return {
		path: normalizeRoutePath(path),
		description: config.description,
		events: config.events,
		platforms: config.platforms,
		schema: config.schema
	};
}
function normalizeResConfig(config, defaults) {
	return {
		events: defaults.events ?? config.events,
		platforms: defaults.platforms ?? config.platforms,
		regular: defaults.regular ?? config.regular
	};
}
function getImporterLabel(importer, index) {
	return importer.name || `anonymous_${index + 1}`;
}
function formatRouteDescription(description) {
	return typeof description === "string" && description.trim() ? description.trim() : void 0;
}
function formatArgReference(arg, displayIndex) {
	const name = typeof arg.name === "string" ? arg.name.trim() : "";
	if (name) return translate("arg.named", { name });
	return translate("arg.indexed", { index: displayIndex });
}
function formatArgRuleHint(arg, displayIndex) {
	const rules = arg.rules ?? [];
	const parts = [];
	const typeRule = rules.find((rule) => rule.type);
	if (rules.find((rule) => rule.required)) parts.push(translate("hint.required"));
	else parts.push(translate("hint.optional"));
	if (typeRule?.type === "number") parts.push(translate("hint.number"));
	else if (typeRule?.type === "enum") parts.push(translate("hint.enum", { values: (typeRule.enum ?? []).join(" / ") }));
	else if (typeRule?.type === "range") parts.push(translate("hint.range"));
	else if (typeRule?.type === "rest") parts.push(translate("hint.rest"));
	else parts.push(translate("hint.text"));
	if (typeof typeRule?.min === "number") parts.push(translate("hint.min", { min: typeRule.min }));
	if (typeof typeRule?.max === "number") parts.push(translate("hint.max", { max: typeRule.max }));
	const suffix = arg.description ? `${translate("hint.separator")}${arg.description}` : "";
	return `${formatArgReference(arg, displayIndex)}${translate("hint.labelSeparator")}${parts.join(translate("hint.separator"))}${suffix}`;
}
function buildSchemaHints(schema) {
	const args = schema?.args ?? [];
	if (args.length === 0) return [];
	return args.map((arg, index) => formatArgRuleHint(arg, index + 1));
}
function quoteCommand(command) {
	return command ? `\`${command}\`` : "";
}
function buildFallbackReply(params) {
	const lines = [];
	const commandText = quoteCommand(params.suggestedKey);
	if (commandText) {
		lines.push(translate("fallback.suggest", { command: commandText }));
		lines.push(translate("fallback.input", { command: commandText }));
	} else lines.push(translate("fallback.unknown"));
	if (params.description) lines.push(params.description);
	if (params.usage && params.usage !== params.suggestedKey) lines.push(translate("fallback.usage", { usage: params.usage }));
	return lines;
}
function buildValidationReply(params) {
	const lines = [];
	const commandText = quoteCommand(params.commandKey);
	if (commandText) lines.push(translate("reply.recognized", { command: commandText }));
	lines.push(params.error || translate("reply.incomplete"));
	if (params.description) lines.push(params.description);
	if (params.usage) lines.push(translate("reply.usage", { usage: params.usage }));
	else if (commandText) lines.push(translate("reply.complete", { command: commandText }));
	if (params.schemaHints && params.schemaHints.length > 0) {
		lines.push(translate("reply.arguments"));
		lines.push(...params.schemaHints);
	}
	return lines;
}
function normalizeInteractionKey(messageText) {
	return String(messageText ?? "").trim().replace(/^notAutoConfirmation:/, "");
}
function getEventPlatform(event) {
	return typeof event.Platform === "string" ? event.Platform : void 0;
}
function getPlatformRouteTextRule(routeText, platform) {
	if (!routeText) return;
	if (platform && routeText.byPlatform?.[platform]) {
		const platformRule = routeText.byPlatform[platform];
		return {
			prefixes: platformRule.prefixes ?? routeText.prefixes,
			stripPrefix: platformRule.stripPrefix ?? routeText.stripPrefix,
			allowBare: platformRule.allowBare ?? routeText.allowBare
		};
	}
	return {
		prefixes: routeText.prefixes,
		stripPrefix: routeText.stripPrefix,
		allowBare: routeText.allowBare
	};
}
function normalizeScopedRouteText(messageText, routeText) {
	const rawText = String(messageText ?? "").trim();
	if (!rawText) return null;
	if (!routeText?.prefixes?.length) return rawText;
	const prefix = routeText.prefixes.find((item) => rawText.startsWith(item));
	if (!prefix) {
		if (routeText.allowBare) return rawText;
		return null;
	}
	if (!routeText.stripPrefix) return rawText;
	return rawText.slice(prefix.length).trim() || null;
}
function getRouteMessageText(event) {
	const routeMessageText = event.__route?.text;
	if (typeof routeMessageText === "string" && routeMessageText.trim()) return routeMessageText;
	return event.MessageText;
}
function shouldParseInteractionAsText(messageText) {
	const text = String(messageText ?? "").trim();
	if (!text) return false;
	return /\s/.test(text);
}
function getLookupCandidates(event, keyPolicy) {
	const eventName = String(event.name ?? "");
	const routeMessageText = getRouteMessageText(event);
	if (eventName.includes("interaction")) {
		if (shouldParseInteractionAsText(routeMessageText)) {
			const parsed = parseMessageText(routeMessageText);
			if (!parsed) return null;
			const oneKey = parsed.tokens[0] ?? "";
			const twoKey = parsed.tokens.length >= 2 ? `${parsed.tokens[0]} ${parsed.tokens[1]}` : "";
			const candidates = (keyPolicy?.maxWords ?? 2) === 1 ? [{
				key: oneKey,
				keyLength: 1
			}] : [...twoKey ? [{
				key: twoKey,
				keyLength: 2
			}] : [], {
				key: oneKey,
				keyLength: 1
			}];
			return {
				normalizedCommand: parsed.normalizedText,
				rawArgs: parsed.tokens,
				candidates
			};
		}
		const interactionKey = normalizeInteractionKey(routeMessageText);
		if (!interactionKey) return null;
		const underscoreIndex = interactionKey.indexOf("_");
		const prefixKey = interactionKey.startsWith("select") ? "select" : underscoreIndex > 0 ? interactionKey.slice(0, underscoreIndex) : interactionKey;
		return {
			normalizedCommand: interactionKey,
			rawArgs: [],
			candidates: [{
				key: interactionKey,
				keyLength: 1
			}, {
				key: prefixKey,
				keyLength: 1
			}]
		};
	}
	const parsed = parseMessageText(routeMessageText);
	if (!parsed) return null;
	const oneKey = parsed.tokens[0] ?? "";
	const twoKey = parsed.tokens.length >= 2 ? `${parsed.tokens[0]} ${parsed.tokens[1]}` : "";
	const candidates = (keyPolicy?.maxWords ?? 2) === 1 ? [{
		key: oneKey,
		keyLength: 1
	}] : [{
		key: twoKey,
		keyLength: 2
	}, {
		key: oneKey,
		keyLength: 1
	}];
	return {
		normalizedCommand: parsed.normalizedText,
		rawArgs: parsed.tokens,
		candidates
	};
}
function buildRouteParams(route, parsedArgs) {
	const params = {};
	const args = route.config.schema?.args ?? [];
	for (let index = 0; index < args.length; index += 1) params[args[index].name] = parsedArgs[index];
	return params;
}
function attachRouteContext(event, context) {
	event.__route = context;
}
function isOnResponseValue(value) {
	return typeof value === "object" && value !== null && "current" in value;
}
function hasSelectValue(value) {
	return typeof value === "object" && value !== null && "select" in value;
}
function isExecutable(value) {
	return typeof value === "function";
}
function unwrapImportedValue(value) {
	if (typeof value === "object" && value !== null && "default" in value) return value.default;
	return value;
}
function toExecutableList(value, eventName) {
	const unwrapped = unwrapImportedValue(value);
	if (eventName && hasSelectValue(unwrapped) && unwrapped.select) {
		if (!(Array.isArray(unwrapped.select) ? unwrapped.select : [unwrapped.select]).includes(eventName)) return [];
	}
	if (isExecutable(unwrapped)) return [unwrapped];
	if (!isOnResponseValue(unwrapped)) return [];
	if (Array.isArray(unwrapped.current)) return unwrapped.current.filter(isExecutable);
	return isExecutable(unwrapped.current) ? [unwrapped.current] : [];
}
var RouteGroup = class RouteGroup {
	app;
	middlewares;
	options;
	scopeId;
	constructor(app, middlewares, options, scopeId) {
		this.app = app;
		this.middlewares = middlewares;
		this.options = options;
		this.scopeId = scopeId;
	}
	group(options, ...middlewares) {
		return new RouteGroup(this.app, [...this.middlewares, ...middlewares], mergeConditions(this.options, options), this.scopeId);
	}
	use(config, ...importers) {
		return this.app.register(config, [...this.middlewares, ...importers], this.options, this.scopeId);
	}
};
var Router = class Router {
	defaults;
	globalImporters = [];
	topLevelEntries = [];
	scopes = /* @__PURE__ */ new Map();
	routes = /* @__PURE__ */ new Map();
	defaultScopeId;
	constructor(options = {}) {
		this.defaults = {
			regular: options.regular,
			events: options.events,
			platforms: options.platforms
		};
	}
	static create(options = {}) {
		return new Router(options);
	}
	group(options, ...middlewares) {
		const mergedOptions = mergeConditions({
			events: this.defaults.events,
			platforms: this.defaults.platforms
		}, options);
		const scopeId = this.createScope(mergedOptions);
		return new RouteGroup(this, middlewares, mergedOptions, scopeId);
	}
	use(config, ...importers) {
		const scopeId = this.ensureDefaultScope();
		return this.register(config, importers, {
			events: this.defaults.events,
			platforms: this.defaults.platforms
		}, scopeId);
	}
	res(config, ...importers) {
		const res = {
			config: normalizeResConfig(config, this.defaults),
			importers
		};
		this.globalImporters.push(res);
		this.topLevelEntries.push({
			kind: "res",
			res
		});
		return this.globalImporters;
	}
	register(config, importers, inheritedOptions, scopeId) {
		if (Array.isArray(config)) return config.map((item) => this.registerOne(item, importers, inheritedOptions, scopeId));
		return this.registerOne(config, importers, inheritedOptions, scopeId);
	}
	registerOne(config, importers, inheritedOptions, scopeId) {
		const normalized = normalizeRouteConfig(config);
		const mergedOptions = mergeConditions(inheritedOptions, {
			path: normalized.path,
			events: normalized.events,
			platforms: normalized.platforms
		});
		const fullPath = normalizePathCondition(mergedOptions.path) ?? "";
		const events = mergedOptions.events ?? [];
		const platforms = mergedOptions.platforms;
		const keyLength = fullPath.split(/\s+/).filter(Boolean).length >= 2 ? 2 : 1;
		if (events.length === 0) throw new Error(`route "${fullPath}" must declare events`);
		const route = {
			config: {
				...normalized,
				path: fullPath,
				events,
				platforms
			},
			scopeId,
			keyLength,
			importers,
			inheritedImporters: importers.slice(0, Math.max(importers.length - 1, 0))
		};
		for (const eventName of events) {
			const routes = this.routes.get(eventName) ?? {
				one: /* @__PURE__ */ new Map(),
				two: /* @__PURE__ */ new Map()
			};
			const targetRoutes = keyLength === 2 ? routes.two : routes.one;
			const existedRoute = targetRoutes.get(fullPath);
			if (existedRoute) {
				const duplicateMessage = `[router-map] 检测到重复指令注册: event=${eventName} path=${fullPath} oldScope=${existedRoute.scopeId} newScope=${scopeId}`;
				const duplicateStrategy = mergedOptions.duplicateKey ?? "warn";
				if (duplicateStrategy === "throw") throw new Error(duplicateMessage);
				if (duplicateStrategy === "warn") logger.warn(duplicateMessage);
			}
			targetRoutes.set(fullPath, route);
			this.routes.set(eventName, routes);
		}
		return route;
	}
	inspect() {
		return Array.from(this.routes.entries()).map(([eventName, routes]) => ({
			eventName,
			routes: [...routes.two.values(), ...routes.one.values()].map((route) => ({
				path: route.config.path,
				description: route?.config?.description,
				importerCount: route.importers.length
			}))
		}));
	}
	get values() {
		return [...this.buildTopLevelEntries(), this.buildFallbackEntry()];
	}
	get define() {
		return defineRouter(this.values);
	}
	match(event, scopeId) {
		const eventName = String(event.name ?? "");
		const lookup = getLookupCandidates(event, (scopeId ? this.scopes.get(scopeId) : void 0)?.options.keyPolicy);
		if (!eventName || !lookup) return { matched: false };
		const routes = this.routes.get(eventName);
		if (!routes) return { matched: false };
		const candidates = lookup.candidates.map((candidate) => ({
			key: candidate.key,
			route: candidate.keyLength === 2 ? routes.two.get(candidate.key) : routes.one.get(candidate.key)
		}));
		for (const candidate of candidates) {
			const route = candidate.route;
			if (!route) continue;
			if (scopeId && route.scopeId !== scopeId) continue;
			const platform = getEventPlatform(event);
			if (route.config.platforms?.length && platform && !route.config.platforms.includes(platform)) continue;
			const rawArgs = lookup.rawArgs.slice(route.keyLength);
			const validation = validateRouteArgsForCommand(route.config.path, rawArgs, route.config.schema);
			if (!validation.valid) return {
				matched: true,
				route,
				eventName,
				normalizedCommand: lookup.normalizedCommand,
				rawArgs,
				parsedArgs: [],
				validation,
				matchedPath: candidate.key,
				importerCount: route.importers.length,
				importerLabels: route.importers.map(getImporterLabel)
			};
			return {
				matched: true,
				route,
				eventName,
				normalizedCommand: lookup.normalizedCommand,
				rawArgs,
				parsedArgs: validation.parsedArgs,
				validation,
				matchedPath: candidate.key,
				importerCount: route.importers.length,
				importerLabels: route.importers.map(getImporterLabel)
			};
		}
		return { matched: false };
	}
	dispatch(event, depth = 0) {
		return this.dispatchInScope(event, void 0, depth);
	}
	async dispatchInScope(event, scopeId, depth = 0) {
		if (depth > ((scopeId ? this.scopes.get(scopeId) : void 0)?.options.redispatch?.maxDepth ?? 3)) return {
			matched: false,
			stopped: true,
			reason: "redispatch_limit",
			eventName: String(event.name ?? ""),
			rawArgs: [],
			parsedArgs: [],
			importerCount: 0,
			importerLabels: []
		};
		const match = this.match(event, scopeId);
		if (!match.matched) return {
			matched: false,
			stopped: false,
			reason: "unmatched",
			eventName: String(event.name ?? ""),
			rawArgs: [],
			parsedArgs: [],
			importerCount: 0,
			importerLabels: []
		};
		if (!match.validation.valid) {
			attachRouteContext(event, {
				key: match.route.config.path,
				text: match.normalizedCommand,
				sourceText: typeof event.MessageText === "string" ? event.MessageText : void 0,
				rewrittenText: match.normalizedCommand,
				rawArgs: match.rawArgs,
				parsedArgs: [],
				params: {}
			});
			return {
				matched: true,
				stopped: true,
				reason: "validation_failed",
				eventName: match.eventName,
				commandKey: match.route.config.path,
				matchedPath: match.matchedPath,
				normalizedCommand: match.normalizedCommand,
				rawArgs: match.rawArgs,
				parsedArgs: [],
				params: {},
				importerCount: match.importerCount,
				importerLabels: match.importerLabels,
				validation: match.validation
			};
		}
		const initialMessageText = String(event.MessageText ?? "");
		const params = buildRouteParams(match.route, match.parsedArgs);
		attachRouteContext(event, {
			key: match.route.config.path,
			text: match.normalizedCommand,
			sourceText: initialMessageText,
			rewrittenText: match.normalizedCommand,
			rawArgs: match.rawArgs,
			parsedArgs: match.parsedArgs,
			params
		});
		const executed = await this.runImporters(match.route.importers, event, depth);
		return {
			matched: true,
			stopped: executed.stopped,
			reason: executed.reason,
			eventName: match.eventName,
			commandKey: match.route.config.path,
			matchedPath: match.matchedPath,
			normalizedCommand: match.normalizedCommand,
			rawArgs: match.rawArgs,
			parsedArgs: match.parsedArgs,
			params,
			importerCount: match.importerCount,
			importerLabels: match.importerLabels,
			validation: match.validation,
			rewrittenMessageText: initialMessageText === String(event.MessageText ?? "") ? void 0 : String(event.MessageText ?? "")
		};
	}
	async handleScopeEvent(scopeId, event, next) {
		const scope = this.scopes.get(scopeId);
		const previousRoute = event.__route;
		const platform = getEventPlatform(event);
		const routeTextRule = getPlatformRouteTextRule(scope?.options.routeText, platform);
		const scopedText = normalizeScopedRouteText(typeof event.MessageText === "string" ? event.MessageText : void 0, routeTextRule);
		if (routeTextRule && !scopedText) {
			await next();
			return;
		}
		if (scopedText) attachRouteContext(event, {
			key: "",
			text: scopedText,
			sourceText: typeof event.MessageText === "string" ? event.MessageText : void 0,
			rewrittenText: scopedText,
			rawArgs: [],
			parsedArgs: [],
			params: {}
		});
		const result = await this.dispatchInScope(event, scopeId);
		if (!result.matched && result.reason === "unmatched") {
			if (previousRoute) event.__route = previousRoute;
			else delete event.__route;
			await next();
			return;
		}
		this.replyValidationFailure(result);
	}
	async handleFallbackEvent(event, next) {
		const applicableScopeIds = this.getApplicableScopeIds(event);
		if (applicableScopeIds.length === 0) {
			await next();
			return;
		}
		const fallbackOptions = applicableScopeIds.map((scopeId) => this.scopes.get(scopeId)?.options.fallback).find(Boolean) ?? {
			suggest: true,
			allowPrefixMatch: true
		};
		if (fallbackOptions.suggest === false) {
			await next();
			return;
		}
		const eventName = String(event.name ?? "");
		const routeMetas = this.inspect().filter((item) => item.eventName === eventName).flatMap((item) => item.routes).filter((route) => {
			const routeEntry = this.routes.get(eventName)?.one.get(route.path) ?? this.routes.get(eventName)?.two.get(route.path);
			return routeEntry ? applicableScopeIds.includes(routeEntry.scopeId) : false;
		});
		const routeKeys = routeMetas.map((route) => route.path);
		const fallback = checkFallbackHint(typeof event.MessageText === "string" ? event.MessageText : void 0, routeKeys, fallbackOptions);
		if (!fallback.matched) {
			await next();
			return;
		}
		const [message] = useMessage();
		const md = Format.createMarkdown();
		const format = Format.create();
		const suggestedRoute = fallback.suggestedKey ? routeMetas.find((route) => route.path === fallback.suggestedKey) : void 0;
		buildFallbackReply({
			suggestedKey: fallback.suggestedKey,
			description: formatRouteDescription(suggestedRoute?.description),
			usage: suggestedRoute?.path
		}).forEach((line, index) => {
			if (index > 0) md.addNewline();
			md.addText(line);
		});
		format.addMarkdown(md);
		message.send({ format });
	}
	replyValidationFailure(result) {
		if (result.reason !== "validation_failed") return;
		const validation = result.validation;
		const [message] = useMessage();
		const md = Format.createMarkdown();
		const format = Format.create();
		const routeEntry = (result.eventName && result.matchedPath ? this.routes.get(result.eventName)?.one.get(result.matchedPath) ?? this.routes.get(result.eventName)?.two.get(result.matchedPath) : void 0) ?? void 0;
		const description = formatRouteDescription(routeEntry?.config.description);
		const schemaHints = buildSchemaHints(routeEntry?.config.schema);
		buildValidationReply({
			error: validation?.valid === false ? validation.error : translate("validation.failed"),
			commandKey: result.commandKey,
			description,
			usage: validation?.valid === false ? validation.usage : void 0,
			schemaHints
		}).forEach((line, index) => {
			if (index > 0) md.addNewline();
			md.addText(line);
		});
		format.addMarkdown(md);
		message.send({ format });
	}
	buildTopLevelEntries() {
		return this.topLevelEntries.flatMap((item) => item.kind === "res" ? this.buildResEntriesFor(item.res) : this.buildScopeEntriesFor(item.scopeId));
	}
	buildResEntriesFor(item) {
		const eventNames = item.config.events ?? [];
		const regular = item.config.regular;
		const platforms = item.config.platforms;
		return item.importers.map((importer) => {
			const base = {
				selects: eventNames,
				regular,
				handler: async () => unwrapImportedValue(await importer())
			};
			if (!platforms?.length) return base;
			return {
				...base,
				platform: [...platforms]
			};
		}).flat();
	}
	buildScopeEntriesFor(scopeId) {
		const scope = this.scopes.get(scopeId);
		if (!scope) return [];
		const selects = scope.options.events ?? this.defaults.events ?? Array.from(this.routes.keys());
		const platforms = scope.options.platforms;
		const base = {
			selects,
			handler: () => {
				return Promise.resolve(async (event, next) => {
					await this.handleScopeEvent(scopeId, event, next);
				});
			}
		};
		if (!platforms?.length) return [base];
		return [{
			...base,
			platform: [...platforms]
		}];
	}
	buildFallbackEntry() {
		const defaultEvents = this.defaults.events ?? [];
		return {
			selects: Array.from(/* @__PURE__ */ new Set([...defaultEvents, ...Array.from(this.routes.keys())])),
			handler: () => {
				return Promise.resolve(async (event, next) => {
					await this.handleFallbackEvent(event, next);
				});
			}
		};
	}
	ensureDefaultScope() {
		if (this.defaultScopeId) return this.defaultScopeId;
		this.defaultScopeId = this.createScope({
			events: this.defaults.events,
			platforms: this.defaults.platforms
		});
		return this.defaultScopeId;
	}
	createScope(options) {
		const id = `scope_${this.topLevelEntries.filter((item) => item.kind === "scope").length + 1}`;
		this.scopes.set(id, {
			id,
			options
		});
		this.topLevelEntries.push({
			kind: "scope",
			scopeId: id
		});
		return id;
	}
	getApplicableScopeIds(event) {
		const eventName = String(event.name ?? "");
		const platform = getEventPlatform(event);
		const messageText = typeof event.MessageText === "string" ? event.MessageText : void 0;
		return this.topLevelEntries.filter((item) => item.kind === "scope").map((item) => item.scopeId).filter((scopeId) => {
			const scope = this.scopes.get(scopeId);
			if (!scope) return false;
			if (scope.options.events?.length && !scope.options.events.includes(eventName)) return false;
			if (scope.options.platforms?.length && platform && !scope.options.platforms.includes(platform)) return false;
			const routeTextRule = getPlatformRouteTextRule(scope.options.routeText, platform);
			if (!routeTextRule) return true;
			return Boolean(normalizeScopedRouteText(messageText, routeTextRule));
		});
	}
	runImporters(importers, event, depth) {
		const visit = async (index) => {
			if (index >= importers.length) return {
				stopped: false,
				reason: "handler_completed"
			};
			const beforeMessageText = String(event.MessageText ?? "");
			const executableList = toExecutableList(await importers[index](), typeof event.name === "string" ? event.name : void 0);
			if (executableList.length === 0) return {
				stopped: true,
				reason: "unsupported_handler"
			};
			let downstreamRequested = false;
			let downstreamResult = null;
			const next = async () => {
				downstreamRequested = true;
				downstreamResult = await visit(index + 1);
			};
			for (const executable of executableList) {
				const result = await executable(event, next);
				if (downstreamRequested) {
					if (downstreamResult) return downstreamResult;
					break;
				}
				if (result === false) return {
					stopped: true,
					reason: "handler_returned_false"
				};
				if (result === true) continue;
				return {
					stopped: true,
					reason: "handler_completed"
				};
			}
			if (downstreamRequested) {
				if (downstreamResult) return downstreamResult;
				const afterMessageText = String(event.MessageText ?? "");
				if (index === importers.length - 1 && afterMessageText && afterMessageText !== beforeMessageText) {
					const redispatched = await this.dispatch(event, depth + 1);
					return {
						stopped: redispatched.stopped,
						reason: redispatched.reason
					};
				}
				return {
					stopped: false,
					reason: "handler_completed"
				};
			}
			return await visit(index + 1);
		};
		return visit(0);
	}
};

//#endregion
export { Router };