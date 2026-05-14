import { defineRouter } from '../define-router';
import { useMessage } from '../hook-use';
import { Format } from '../message-format-old';
import { checkFallbackHint } from './fallback';
import { normalizeRoutePath, parseMessageText } from './parser';
import type {
  AppDispatchResult,
  AppMatchResult,
  NormalizedRouteConfig,
  RegisteredRes,
  RegisteredRoute,
  RouteContext,
  RouteDefinition,
  RouteDefinitions,
  RouteExecutable,
  RouteGroupConditions,
  RouteImporter,
  RouteParams,
  RouteResConfig,
  RouteTextConfig,
  RouteTextRule
} from './types';
import type { RouteSchemaValue } from './validator';
import { validateRouteArgsForCommand } from './validator';

export type RouterOptions<P extends string = string, E extends string = string> = {
  regular?: RegExp;
  events?: readonly E[];
  platforms?: readonly P[];
};

type GroupOptions<P extends string = string, E extends string = string> = RouteGroupConditions<P, E>;
type ScopeRecord<P extends string = string, E extends string = string> = {
  id: string;
  options: GroupOptions<P, E>;
};
type TopLevelEntry<P extends string = string, E extends string = string> = { kind: 'res'; res: RegisteredRes<P, E> } | { kind: 'scope'; scopeId: string };

function normalizePathCondition(path?: string) {
  if (path === undefined) {
    return undefined;
  }

  return normalizeRoutePath(path);
}

function mergeConditions<P extends string, E extends string>(parent: GroupOptions<P, E>, current: GroupOptions<P, E>): GroupOptions<P, E> {
  const parentPath = normalizePathCondition(parent.path);
  const currentPath = normalizePathCondition(current.path);
  let path: string | undefined;

  if (currentPath !== undefined) {
    path = parentPath ? normalizeRoutePath(`${parentPath} ${currentPath}`) : currentPath;
  } else {
    path = parentPath;
  }

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

function normalizeRouteConfig<P extends string, E extends string>(config: RouteDefinition<P, E>): NormalizedRouteConfig<P, E> {
  if (typeof config === 'string') {
    return {
      path: normalizeRoutePath(config)
    };
  }

  const path = config.path;

  if (!path) {
    throw new Error('route path is required');
  }

  return {
    path: normalizeRoutePath(path),
    description: config.description,
    events: config.events,
    platforms: config.platforms,
    schema: config.schema
  };
}

function normalizeResConfig<P extends string, E extends string>(
  config: RouteResConfig<P, E>,
  defaults: Pick<RouterOptions<P, E>, 'events' | 'platforms' | 'regular'>
): RouteResConfig<P, E> {
  return {
    events: defaults.events ?? config.events,
    platforms: defaults.platforms ?? config.platforms,
    regular: defaults.regular ?? config.regular
  };
}

function getImporterLabel(importer: RouteImporter, index: number) {
  return importer.name || `anonymous_${index + 1}`;
}

function formatRouteDescription(description?: string) {
  return typeof description === 'string' && description.trim() ? description.trim() : undefined;
}

function formatArgReference(arg: { name?: string }, displayIndex: number) {
  const name = typeof arg.name === 'string' ? arg.name.trim() : '';

  if (name) {
    return `参数「${name}」`;
  }

  return `第${displayIndex}个参数`;
}

function formatArgRuleHint(arg: { name: string; description?: string; rules?: any[] }, displayIndex: number) {
  const rules = arg.rules ?? [];
  const parts: string[] = [];
  const typeRule = rules.find(rule => rule.type);
  const requiredRule = rules.find(rule => rule.required);

  if (requiredRule) {
    parts.push('必填');
  } else {
    parts.push('可选');
  }

  if (typeRule?.type === 'number') {
    parts.push('数字');
  } else if (typeRule?.type === 'enum') {
    parts.push(`枚举: ${(typeRule.enum ?? []).join(' / ')}`);
  } else if (typeRule?.type === 'range') {
    parts.push('区间');
  } else if (typeRule?.type === 'rest') {
    parts.push('剩余文本');
  } else {
    parts.push('文本');
  }

  if (typeof typeRule?.min === 'number') {
    parts.push(`最小 ${typeRule.min}`);
  }
  if (typeof typeRule?.max === 'number') {
    parts.push(`最大 ${typeRule.max}`);
  }

  const suffix = arg.description ? `，${arg.description}` : '';

  return `${formatArgReference(arg, displayIndex)}：${parts.join('，')}${suffix}`;
}

function buildSchemaHints(schema?: { args?: Array<{ name: string; description?: string; rules?: any[] }> }) {
  const args = schema?.args ?? [];

  if (args.length === 0) {
    return [];
  }

  return args.map((arg, index) => formatArgRuleHint(arg, index + 1));
}

function quoteCommand(command?: string) {
  return command ? `\`${command}\`` : '';
}

function buildFallbackReply(params: { suggestedKey?: string; description?: string; usage?: string }) {
  const lines: string[] = [];
  const commandText = quoteCommand(params.suggestedKey);

  if (commandText) {
    lines.push(`我猜你想用的是 ${commandText}。`);
    lines.push(`可以直接输入：${commandText}`);
  } else {
    lines.push('我还没完全认出你这条指令。');
  }

  if (params.description) {
    lines.push(params.description);
  }

  if (params.usage && params.usage !== params.suggestedKey) {
    lines.push(`如果你想继续，可以这样写：\`${params.usage}\``);
  }

  return lines;
}

function buildValidationReply(params: { error?: string; commandKey?: string; description?: string; usage?: string; schemaHints?: string[] }) {
  const lines: string[] = [];
  const commandText = quoteCommand(params.commandKey);

  if (commandText) {
    lines.push(`我已经识别到你想用的是 ${commandText}。`);
  }

  lines.push(params.error || '这条指令的参数还不完整。');

  if (params.description) {
    lines.push(params.description);
  }

  if (params.usage) {
    lines.push(`你可以这样输入：\`${params.usage}\``);
  } else if (commandText) {
    lines.push(`请继续补全 ${commandText} 所需的参数。`);
  }

  if (params.schemaHints && params.schemaHints.length > 0) {
    lines.push('参数说明：');
    lines.push(...params.schemaHints);
  }

  return lines;
}

function normalizeInteractionKey(messageText?: string) {
  return String(messageText ?? '')
    .trim()
    .replace(/^notAutoConfirmation:/, '');
}

function getEventPlatform(event: Record<string, unknown>) {
  return typeof event.Platform === 'string' ? event.Platform : undefined;
}

function getPlatformRouteTextRule<P extends string>(routeText: RouteTextConfig<P> | undefined, platform: string | undefined) {
  if (!routeText) {
    return undefined;
  }

  if (platform && routeText.byPlatform?.[platform as P]) {
    const platformRule = routeText.byPlatform[platform as P] as RouteTextRule;

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

function normalizeScopedRouteText(messageText: string | undefined, routeText?: RouteTextRule) {
  const rawText = String(messageText ?? '').trim();

  if (!rawText) {
    return null;
  }

  if (!routeText?.prefixes?.length) {
    return rawText;
  }

  const prefix = routeText.prefixes.find(item => rawText.startsWith(item));

  if (!prefix) {
    if (routeText.allowBare) {
      return rawText;
    }

    return null;
  }

  if (!routeText.stripPrefix) {
    return rawText;
  }

  const stripped = rawText.slice(prefix.length).trim();

  return stripped || null;
}

function getRouteMessageText(event: { MessageText?: string; __route?: { text?: string } }) {
  const routeMessageText = event.__route?.text;

  if (typeof routeMessageText === 'string' && routeMessageText.trim()) {
    return routeMessageText;
  }

  return event.MessageText;
}

function shouldParseInteractionAsText(messageText?: string) {
  const text = String(messageText ?? '').trim();

  if (!text) {
    return false;
  }

  // 文本型 interaction（slash command / select value 转命令文本 / 按钮里携带命令参数）
  // 需要像普通消息一样拆词和解析参数，而不是按 custom_id 整串精确匹配。
  return /\s/.test(text);
}

function getLookupCandidates(event: { name?: string; MessageText?: string; __route?: { text?: string } }, keyPolicy?: GroupOptions['keyPolicy']) {
  const eventName = String(event.name ?? '');
  const routeMessageText = getRouteMessageText(event);

  if (eventName.includes('interaction')) {
    if (shouldParseInteractionAsText(routeMessageText)) {
      const parsed = parseMessageText(routeMessageText);

      if (!parsed) {
        return null;
      }

      const oneKey = parsed.tokens[0] ?? '';
      const twoKey = parsed.tokens.length >= 2 ? `${parsed.tokens[0]} ${parsed.tokens[1]}` : '';
      const maxWords = keyPolicy?.maxWords ?? 2;
      const candidates =
        maxWords === 1
          ? [{ key: oneKey, keyLength: 1 as const }]
          : [...(twoKey ? [{ key: twoKey, keyLength: 2 as const }] : []), { key: oneKey, keyLength: 1 as const }];

      return {
        normalizedCommand: parsed.normalizedText,
        rawArgs: parsed.tokens,
        candidates
      };
    }

    const interactionKey = normalizeInteractionKey(routeMessageText);

    if (!interactionKey) {
      return null;
    }

    const underscoreIndex = interactionKey.indexOf('_');
    const prefixKey = interactionKey.startsWith('select') ? 'select' : underscoreIndex > 0 ? interactionKey.slice(0, underscoreIndex) : interactionKey;

    return {
      normalizedCommand: interactionKey,
      rawArgs: [] as string[],
      candidates: [
        { key: interactionKey, keyLength: 1 as const },
        { key: prefixKey, keyLength: 1 as const }
      ]
    };
  }

  const parsed = parseMessageText(routeMessageText);

  if (!parsed) {
    return null;
  }

  const oneKey = parsed.tokens[0] ?? '';
  const twoKey = parsed.tokens.length >= 2 ? `${parsed.tokens[0]} ${parsed.tokens[1]}` : '';
  const maxWords = keyPolicy?.maxWords ?? 2;
  const candidates =
    maxWords === 1
      ? [{ key: oneKey, keyLength: 1 as const }]
      : [
          { key: twoKey, keyLength: 2 as const },
          { key: oneKey, keyLength: 1 as const }
        ];

  return {
    normalizedCommand: parsed.normalizedText,
    rawArgs: parsed.tokens,
    candidates
  };
}

function buildRouteParams(route: RegisteredRoute, parsedArgs: RouteSchemaValue[]): RouteParams {
  const params: RouteParams = {};
  const args = route.config.schema?.args ?? [];

  for (let index = 0; index < args.length; index += 1) {
    params[args[index].name] = parsedArgs[index];
  }

  return params;
}

function attachRouteContext(event: Record<string, unknown>, context: RouteContext) {
  event.__route = context;
}

function isOnResponseValue(value: unknown): value is { current: RouteExecutable | RouteExecutable[] } {
  return typeof value === 'object' && value !== null && 'current' in value;
}

function hasSelectValue(value: unknown): value is { select?: string | string[] } {
  return typeof value === 'object' && value !== null && 'select' in value;
}

function isExecutable(value: unknown): value is RouteExecutable {
  return typeof value === 'function';
}

function unwrapImportedValue(value: unknown) {
  if (typeof value === 'object' && value !== null && 'default' in value) {
    return value.default;
  }

  return value;
}

function toExecutableList(value: unknown, eventName?: string): RouteExecutable[] {
  const unwrapped = unwrapImportedValue(value);

  if (eventName && hasSelectValue(unwrapped) && unwrapped.select) {
    const selects = Array.isArray(unwrapped.select) ? unwrapped.select : [unwrapped.select];

    if (!selects.includes(eventName)) {
      return [];
    }
  }

  if (isExecutable(unwrapped)) {
    return [unwrapped];
  }

  if (!isOnResponseValue(unwrapped)) {
    return [];
  }

  if (Array.isArray(unwrapped.current)) {
    return unwrapped.current.filter(isExecutable);
  }

  return isExecutable(unwrapped.current) ? [unwrapped.current] : [];
}

class RouteGroup<P extends string, E extends string> {
  private readonly app: Router<P, E>;
  private readonly middlewares: RouteImporter[];
  private readonly options: GroupOptions<P, E>;
  private readonly scopeId: string;

  constructor(app: Router<P, E>, middlewares: RouteImporter[], options: GroupOptions<P, E>, scopeId: string) {
    this.app = app;
    this.middlewares = middlewares;
    this.options = options;
    this.scopeId = scopeId;
  }

  group(options: GroupOptions<P, E>, ...middlewares: RouteImporter[]) {
    return new RouteGroup(this.app, [...this.middlewares, ...middlewares], mergeConditions(this.options, options), this.scopeId);
  }

  use(config: RouteDefinitions<P, E>, ...importers: RouteImporter[]) {
    return this.app.register(config, [...this.middlewares, ...importers], this.options, this.scopeId);
  }
}

export class Router<P extends string = string, E extends string = string> {
  private readonly defaults: RouterOptions<P, E>;
  private readonly globalImporters: RegisteredRes<P, E>[] = [];
  private readonly topLevelEntries: TopLevelEntry<P, E>[] = [];
  private readonly scopes = new Map<string, ScopeRecord<P, E>>();
  private readonly routes = new Map<
    string,
    {
      one: Map<string, RegisteredRoute<P, E>>;
      two: Map<string, RegisteredRoute<P, E>>;
    }
  >();
  private defaultScopeId?: string;

  constructor(options: RouterOptions<P, E> = {}) {
    this.defaults = {
      regular: options.regular,
      events: options.events,
      platforms: options.platforms
    };
  }

  static create<const P extends string, const E extends string>(options: RouterOptions<P, E> = {}) {
    return new Router<P, E>(options);
  }

  group(options: GroupOptions<P, E>, ...middlewares: RouteImporter[]) {
    const mergedOptions = mergeConditions({ events: this.defaults.events, platforms: this.defaults.platforms }, options);
    const scopeId = this.createScope(mergedOptions);

    return new RouteGroup(this, middlewares, mergedOptions, scopeId);
  }

  use(config: RouteDefinitions<P, E>, ...importers: RouteImporter[]) {
    const scopeId = this.ensureDefaultScope();

    return this.register(config, importers, { events: this.defaults.events, platforms: this.defaults.platforms }, scopeId);
  }

  res(config: RouteResConfig<P, E>, ...importers: RouteImporter[]) {
    const res = {
      config: normalizeResConfig(config, this.defaults),
      importers
    };

    this.globalImporters.push(res);
    this.topLevelEntries.push({
      kind: 'res',
      res
    });

    return this.globalImporters;
  }

  register(config: RouteDefinitions<P, E>, importers: RouteImporter[], inheritedOptions: GroupOptions<P, E>, scopeId: string) {
    if (Array.isArray(config)) {
      return config.map(item => this.registerOne(item, importers, inheritedOptions, scopeId));
    }

    return this.registerOne(config, importers, inheritedOptions, scopeId);
  }

  private registerOne(config: RouteDefinition<P, E>, importers: RouteImporter[], inheritedOptions: GroupOptions<P, E>, scopeId: string) {
    const normalized = normalizeRouteConfig(config);
    const mergedOptions = mergeConditions(inheritedOptions, {
      path: normalized.path,
      events: normalized.events,
      platforms: normalized.platforms
    });
    const fullPath = normalizePathCondition(mergedOptions.path) ?? '';
    const events = mergedOptions.events ?? [];
    const platforms = mergedOptions.platforms;
    const tokenLength = fullPath.split(/\s+/).filter(Boolean).length;
    const keyLength = tokenLength >= 2 ? 2 : 1;

    if (events.length === 0) {
      throw new Error(`route "${fullPath}" must declare events`);
    }

    const route: RegisteredRoute<P, E> = {
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
        one: new Map<string, RegisteredRoute<P, E>>(),
        two: new Map<string, RegisteredRoute<P, E>>()
      };

      const targetRoutes = keyLength === 2 ? routes.two : routes.one;
      const existedRoute = targetRoutes.get(fullPath);

      if (existedRoute) {
        const duplicateMessage = `[router-map] 检测到重复指令注册: event=${eventName} path=${fullPath} oldScope=${existedRoute.scopeId} newScope=${scopeId}`;

        const duplicateStrategy = mergedOptions.duplicateKey ?? 'warn';

        if (duplicateStrategy === 'throw') {
          throw new Error(duplicateMessage);
        }
        if (duplicateStrategy === 'warn') {
          logger.warn(duplicateMessage);
        }
      }

      targetRoutes.set(fullPath, route);

      this.routes.set(eventName, routes);
    }

    return route;
  }

  inspect() {
    return Array.from(this.routes.entries()).map(([eventName, routes]) => ({
      eventName,
      routes: [...routes.two.values(), ...routes.one.values()].map(route => ({
        path: route.config.path,
        description: route?.config?.description,
        importerCount: route.importers.length
      }))
    }));
  }

  get values(): any[] {
    return [...this.buildTopLevelEntries(), this.buildFallbackEntry()];
  }

  get define() {
    return defineRouter(this.values);
  }

  match(event: { name?: string; MessageText?: string; platform?: string }, scopeId?: string): AppMatchResult {
    const eventName = String(event.name ?? '');
    const scope = scopeId ? this.scopes.get(scopeId) : undefined;
    const lookup = getLookupCandidates(event, scope?.options.keyPolicy);

    if (!eventName || !lookup) {
      return { matched: false };
    }

    const routes = this.routes.get(eventName);

    if (!routes) {
      return { matched: false };
    }

    const candidates = lookup.candidates.map(candidate => ({
      key: candidate.key,
      route: candidate.keyLength === 2 ? routes.two.get(candidate.key) : routes.one.get(candidate.key)
    }));

    for (const candidate of candidates) {
      const route = candidate.route;

      if (!route) {
        continue;
      }

      if (scopeId && route.scopeId !== scopeId) {
        continue;
      }

      const platform = getEventPlatform(event);

      if (route.config.platforms?.length && platform && !(route.config.platforms as readonly string[]).includes(platform)) {
        continue;
      }

      const rawArgs = lookup.rawArgs.slice(route.keyLength);
      const validation = validateRouteArgsForCommand(route.config.path, rawArgs, route.config.schema);

      if (!validation.valid) {
        return {
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
      }

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

  dispatch(event: Record<string, unknown>, depth = 0): Promise<AppDispatchResult> {
    return this.dispatchInScope(event, undefined, depth);
  }

  async dispatchInScope(event: Record<string, unknown>, scopeId: string | undefined, depth = 0): Promise<AppDispatchResult> {
    const scope = scopeId ? this.scopes.get(scopeId) : undefined;
    const maxRedispatchDepth = scope?.options.redispatch?.maxDepth ?? 3;

    if (depth > maxRedispatchDepth) {
      return {
        matched: false,
        stopped: true,
        reason: 'redispatch_limit',
        eventName: String(event.name ?? ''),
        rawArgs: [],
        parsedArgs: [],
        importerCount: 0,
        importerLabels: []
      };
    }

    const match = this.match(event, scopeId);

    if (!match.matched) {
      return {
        matched: false,
        stopped: false,
        reason: 'unmatched',
        eventName: String(event.name ?? ''),
        rawArgs: [],
        parsedArgs: [],
        importerCount: 0,
        importerLabels: []
      };
    }

    if (!match.validation.valid) {
      attachRouteContext(event, {
        key: match.route.config.path,
        text: match.normalizedCommand,
        sourceText: typeof event.MessageText === 'string' ? event.MessageText : undefined,
        rewrittenText: match.normalizedCommand,
        rawArgs: match.rawArgs,
        parsedArgs: [],
        params: {}
      });

      return {
        matched: true,
        stopped: true,
        reason: 'validation_failed',
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

    const initialMessageText = String(event.MessageText ?? '');
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
      rewrittenMessageText: initialMessageText === String(event.MessageText ?? '') ? undefined : String(event.MessageText ?? '')
    };
  }

  async handleScopeEvent(scopeId: string, event: Record<string, unknown>, next: () => void | Promise<void>) {
    const scope = this.scopes.get(scopeId);
    const previousRoute = event.__route;
    const platform = getEventPlatform(event);
    const routeTextRule = getPlatformRouteTextRule(scope?.options.routeText, platform);
    const scopedText = normalizeScopedRouteText(typeof event.MessageText === 'string' ? event.MessageText : undefined, routeTextRule);

    if (routeTextRule && !scopedText) {
      await next();

      return;
    }

    if (scopedText) {
      attachRouteContext(event, {
        key: '',
        text: scopedText,
        sourceText: typeof event.MessageText === 'string' ? event.MessageText : undefined,
        rewrittenText: scopedText,
        rawArgs: [],
        parsedArgs: [],
        params: {}
      });
    }

    const result = await this.dispatchInScope(event, scopeId);

    if (!result.matched && result.reason === 'unmatched') {
      if (previousRoute) {
        event.__route = previousRoute;
      } else {
        delete event.__route;
      }

      await next();

      return;
    }

    this.replyValidationFailure(result);
  }

  async handleFallbackEvent(event: Record<string, unknown>, next: () => void | Promise<void>) {
    const applicableScopeIds = this.getApplicableScopeIds(event);

    if (applicableScopeIds.length === 0) {
      await next();

      return;
    }

    const fallbackOptions = applicableScopeIds.map(scopeId => this.scopes.get(scopeId)?.options.fallback).find(Boolean) ?? {
      suggest: true,
      allowPrefixMatch: true
    };

    if (fallbackOptions.suggest === false) {
      await next();

      return;
    }

    const eventName = String(event.name ?? '');
    const routeMetas = this.inspect()
      .filter(item => item.eventName === eventName)
      .flatMap(item => item.routes)
      .filter(route => {
        const routeEntry = this.routes.get(eventName)?.one.get(route.path) ?? this.routes.get(eventName)?.two.get(route.path);

        return routeEntry ? applicableScopeIds.includes(routeEntry.scopeId) : false;
      });
    const routeKeys = routeMetas.map(route => route.path);
    const fallback = checkFallbackHint(typeof event.MessageText === 'string' ? event.MessageText : undefined, routeKeys, fallbackOptions);

    if (!fallback.matched) {
      await next();

      return;
    }

    const [message] = useMessage();
    const md = Format.createMarkdown();
    const format = Format.create();
    const suggestedRoute = fallback.suggestedKey ? routeMetas.find(route => route.path === fallback.suggestedKey) : undefined;
    const replyLines = buildFallbackReply({
      suggestedKey: fallback.suggestedKey,
      description: formatRouteDescription(suggestedRoute?.description),
      usage: suggestedRoute?.path
    });

    replyLines.forEach((line, index) => {
      if (index > 0) {
        md.addNewline();
      }
      md.addText(line);
    });

    format.addMarkdown(md);
    void message.send({ format });
  }

  private replyValidationFailure(result: AppDispatchResult) {
    if (result.reason !== 'validation_failed') {
      return;
    }

    const validation = result.validation;
    const [message] = useMessage();
    const md = Format.createMarkdown();
    const format = Format.create();
    const routeEntry =
      (result.eventName && result.matchedPath
        ? (this.routes.get(result.eventName)?.one.get(result.matchedPath) ?? this.routes.get(result.eventName)?.two.get(result.matchedPath))
        : undefined) ?? undefined;
    const description = formatRouteDescription(routeEntry?.config.description);
    const schemaHints = buildSchemaHints(routeEntry?.config.schema);
    const replyLines = buildValidationReply({
      error: validation && !validation.valid ? validation.error : '参数校验失败',
      commandKey: result.commandKey,
      description,
      usage: validation && !validation.valid ? validation.usage : undefined,
      schemaHints
    });

    replyLines.forEach((line, index) => {
      if (index > 0) {
        md.addNewline();
      }
      md.addText(line);
    });

    format.addMarkdown(md);
    void message.send({ format });
  }

  private buildTopLevelEntries(): any[] {
    return this.topLevelEntries.flatMap(item => (item.kind === 'res' ? this.buildResEntriesFor(item.res) : this.buildScopeEntriesFor(item.scopeId)));
  }

  private buildResEntriesFor(item: RegisteredRes<P, E>): any[] {
    const eventNames = item.config.events ?? [];
    const regular = item.config.regular;
    const platforms = item.config.platforms;

    return item.importers
      .map(importer => {
        const base = {
          selects: eventNames,
          regular,
          handler: async () => unwrapImportedValue(await importer())
        };

        if (!platforms?.length) {
          return base;
        }

        return {
          ...base,
          platform: [...platforms]
        };
      })
      .flat() as any[];
  }

  private buildScopeEntriesFor(scopeId: string): any[] {
    const scope = this.scopes.get(scopeId);

    if (!scope) {
      return [];
    }

    const selects = (scope.options.events ?? this.defaults.events ?? Array.from(this.routes.keys())) as readonly E[];
    const platforms = scope.options.platforms;
    const base = {
      selects,
      handler: () => {
        return Promise.resolve(async (event: Record<string, unknown>, next: () => void | Promise<void>) => {
          await this.handleScopeEvent(scopeId, event, next);
        });
      }
    };

    if (!platforms?.length) {
      return [base];
    }

    return [
      {
        ...base,
        platform: [...platforms]
      }
    ] as any[];
  }

  private buildFallbackEntry(): any {
    const defaultEvents = this.defaults.events ?? [];
    const eventNames = Array.from(new Set([...defaultEvents, ...(Array.from(this.routes.keys()) as E[])]));

    return {
      selects: eventNames,
      handler: () => {
        return Promise.resolve(async (event: Record<string, unknown>, next: () => void | Promise<void>) => {
          await this.handleFallbackEvent(event, next);
        });
      }
    };
  }

  private ensureDefaultScope() {
    if (this.defaultScopeId) {
      return this.defaultScopeId;
    }

    this.defaultScopeId = this.createScope({
      events: this.defaults.events,
      platforms: this.defaults.platforms
    });

    return this.defaultScopeId;
  }

  private createScope(options: GroupOptions<P, E>) {
    const id = `scope_${this.topLevelEntries.filter(item => item.kind === 'scope').length + 1}`;

    this.scopes.set(id, {
      id,
      options
    });
    this.topLevelEntries.push({
      kind: 'scope',
      scopeId: id
    });

    return id;
  }

  private getApplicableScopeIds(event: Record<string, unknown>) {
    const eventName = String(event.name ?? '');
    const platform = getEventPlatform(event);
    const messageText = typeof event.MessageText === 'string' ? event.MessageText : undefined;

    return this.topLevelEntries
      .filter((item): item is { kind: 'scope'; scopeId: string } => item.kind === 'scope')
      .map(item => item.scopeId)
      .filter(scopeId => {
        const scope = this.scopes.get(scopeId);

        if (!scope) {
          return false;
        }

        if (scope.options.events?.length && !scope.options.events.includes(eventName as E)) {
          return false;
        }

        if (scope.options.platforms?.length && platform && !scope.options.platforms.includes(platform as P)) {
          return false;
        }

        const routeTextRule = getPlatformRouteTextRule(scope.options.routeText, platform);

        if (!routeTextRule) {
          return true;
        }

        return Boolean(normalizeScopedRouteText(messageText, routeTextRule));
      });
  }

  private runImporters(importers: RouteImporter[], event: Record<string, unknown>, depth: number) {
    const visit = async (index: number): Promise<{ stopped: boolean; reason: AppDispatchResult['reason'] }> => {
      if (index >= importers.length) {
        return { stopped: false, reason: 'handler_completed' };
      }

      const beforeMessageText = String(event.MessageText ?? '');
      const imported = await importers[index]();
      const executableList = toExecutableList(imported, typeof event.name === 'string' ? event.name : undefined);

      if (executableList.length === 0) {
        return { stopped: true, reason: 'unsupported_handler' };
      }

      let downstreamRequested = false;
      let downstreamResult: { stopped: boolean; reason: AppDispatchResult['reason'] } | null = null;

      const next = async () => {
        downstreamRequested = true;
        downstreamResult = await visit(index + 1);
      };

      for (const executable of executableList) {
        const result = await executable(event, next);

        if (downstreamRequested) {
          if (downstreamResult) {
            return downstreamResult;
          }

          break;
        }

        if (result === false) {
          return { stopped: true, reason: 'handler_returned_false' };
        }

        if (result === true) {
          continue;
        }

        return { stopped: true, reason: 'handler_completed' };
      }

      if (downstreamRequested) {
        if (downstreamResult) {
          return downstreamResult;
        }

        const afterMessageText = String(event.MessageText ?? '');

        if (index === importers.length - 1 && afterMessageText && afterMessageText !== beforeMessageText) {
          const redispatched = await this.dispatch(event, depth + 1);

          return {
            stopped: redispatched.stopped,
            reason: redispatched.reason
          };
        }

        return { stopped: false, reason: 'handler_completed' };
      }

      return await visit(index + 1);
    };

    return visit(0);
  }
}
