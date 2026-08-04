import type { EventKeys, Events } from '../types/index.js';
import { showErrorModule } from '../common/utils.js';
import { finishCurrentTrace, getCurrentAppName, getCurrentEvent, withEventContext } from './runtime/hook-event-context.js';
import { dispatchEventError } from './runtime/event-error.js';
import { getChildrenApp } from './runtime/store.js';
import { scheduleCancel, scheduleTimeout } from './runtime/schedule-store.js';
import {
  activeContexts,
  clearActiveContexts,
  clearActiveContextsByApp,
  getActiveContextKeys,
  putActiveContext,
  removeActiveContext,
  type ContextRegistryEntry
} from './runtime/context-registry.js';

type ScopeKey = string;
type ContextState = Record<string, unknown>;

type ContextDispatchAction<T = unknown> = {
  type: string;
  payload: T;
};

export type ContextAction<T = unknown> = {
  /** Payload supplied when the context was opened. */
  readonly payload: T;
  /** Aborts when this context is replaced, closed, expired, or unloaded. */
  readonly signal: AbortSignal;
  /** Keep the context but allow this event to enter the normal router. */
  pass: () => void;
  /** Remove the context after the current event finishes. */
  close: () => void;
};

export type ContextHandler<S extends ContextState, T = unknown> = (
  event: Events[EventKeys],
  state: S,
  action: ContextAction<T>
) => void | Promise<void>;

type ContextConfig<S extends ContextState, R extends Record<string, ContextHandler<S, any>>> = {
  name: string;
  /** Events this context can claim. */
  events: readonly EventKeys[];
  scope: readonly string[];
  /** What happens when the same context is opened for the same scope again. */
  conflict?: 'replace' | 'reject';
  /** Whether a failing handler leaves its active context open. */
  onError?: 'close' | 'keep';
  /** Time to live in milliseconds, or a compact value such as `5m`. */
  expiresIn?: number | string;
  initialState: S | ((payload: unknown) => S);
  handlers: R;
};

type ContextDefinition = {
  name: string;
  events: readonly EventKeys[];
  scope: readonly string[];
  conflict: 'replace' | 'reject';
  onError: 'close' | 'keep';
  expiresIn?: number;
  initialState: (payload: unknown) => ContextState;
  handlers: Record<string, ContextHandler<ContextState, unknown>>;
};

export type Context = {
  name: string;
  [handler: string]: unknown;
};

export type ContextConfiguration = {
  contexts: Record<string, Context>;
};

export type ContextPhase = 'middleware' | 'response';

type ActiveContext = ContextRegistryEntry & {
  phase: ContextPhase;
  definition: ContextDefinition;
  handler: string;
  payload: unknown;
  state: ContextState;
  expiresAt?: number;
  createdAt: number;
  order: number;
  controller: AbortController;
};

const contextQueues = new Map<ScopeKey, Promise<void>>();
let contextSequence = 0;
const contextDefinitionSymbol = Symbol('alemonjs.contextDefinition');
const contextDefinitionSymbolForContent = Symbol('alemonjs.contextDefinitionForContent');

type InternalContextAction = ContextDispatchAction & {
  [contextDefinitionSymbol]?: {
    definition: ContextDefinition;
    handler: string;
  };
};

type InternalContext = Context & {
  [contextDefinitionSymbolForContent]?: ContextDefinition;
};

const parseExpiresIn = (value?: number | string): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const match = /^(\d+)\s*(ms|s|m|h|d)?$/i.exec(value.trim());

  if (!match) {
    throw new Error(`Invalid context expiresIn: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase() ?? 'ms';
  const factor = unit === 'd' ? 86_400_000 : unit === 'h' ? 3_600_000 : unit === 'm' ? 60_000 : unit === 's' ? 1_000 : 1;

  return amount * factor;
};

const cloneState = <S extends ContextState>(state: S): S => {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    throw new Error('Context initialState must be an object');
  }

  try {
    return globalThis.structuredClone(state);
  } catch {
    throw new Error('Context initialState must be structured-cloneable');
  }
};

const clonePayload = <T>(payload: T): T => {
  try {
    return globalThis.structuredClone(payload);
  } catch {
    throw new Error('Context payload must be structured-cloneable');
  }
};

const getScopeKey = (appName: string, definition: ContextDefinition, event: Record<string, unknown>): ScopeKey => {
  const values = definition.scope.map(key => {
    const value = event[key];

    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      throw new Error(`Invalid context scope value: ${key} must be a string, number or boolean`);
    }

    return [key, String(value)] as const;
  });

  return JSON.stringify([appName, definition.name, values]);
};

const isExpired = (context: ActiveContext, now = Date.now()) => context.expiresAt !== undefined && context.expiresAt <= now;

/**
 * Creates the context configuration consumed by defineChildren().register().
 * The wrapper leaves room for future context-level options without changing
 * the responseContent registration shape.
 */
export const configureContext = (config: ContextConfiguration): ContextConfiguration => {
  const contexts = Object.values(config.contexts ?? {});
  const names = new Set<string>();

  if (contexts.length === 0) {
    throw new Error('configureContext requires at least one context');
  }

  for (const context of contexts as InternalContext[]) {
    const definition = context[contextDefinitionSymbolForContent];

    if (!definition) {
      throw new Error('configureContext only accepts contexts created by createContext');
    }
    if (names.has(definition.name)) {
      throw new Error(`Duplicate context name: ${definition.name}`);
    }
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
export const createContext = <S extends ContextState, R extends Record<string, ContextHandler<S, any>>>(config: ContextConfig<S, R>) => {
  if (!config.name) {
    throw new Error('Context name is required');
  }
  if (config.events.length === 0) {
    throw new Error(`Context events are required: ${config.name}`);
  }
  if (config.scope.length === 0) {
    throw new Error(`Context scope is required: ${config.name}`);
  }
  if (Object.keys(config.handlers).length === 0) {
    throw new Error(`Context handlers are required: ${config.name}`);
  }
  if (Object.prototype.hasOwnProperty.call(config.handlers, 'cancel')) {
    throw new Error(`Context handler name is reserved: ${config.name}/cancel`);
  }

  const initialState = typeof config.initialState === 'function' ? config.initialState : cloneState(config.initialState);
  const definition: ContextDefinition = {
    name: config.name,
    events: Object.freeze([...config.events]),
    scope: Object.freeze([...config.scope]),
    conflict: config.conflict ?? 'replace',
    onError: config.onError ?? 'close',
    expiresIn: parseExpiresIn(config.expiresIn),
    initialState: payload => {
      const state = typeof initialState === 'function' ? initialState(payload) : initialState;

      return cloneState(state);
    },
    handlers: Object.freeze({ ...config.handlers })
  };

  const actions = Object.fromEntries(
    Object.keys(config.handlers).map(handler => [
      handler,
      (payload?: unknown): void => {
        const action: InternalContextAction = { type: `${config.name}/${handler}`, payload };

        Object.defineProperty(action, contextDefinitionSymbol, {
          value: { definition, handler }
        });

        dispatchContext(action);
      }
    ])
  ) as {
      [K in keyof R]: (payload?: unknown) => void;
    };

  const context: InternalContext = {
    name: config.name,
    ...actions,
    cancel: (): boolean => cancelContext(definition)
  };

  Object.defineProperty(context, contextDefinitionSymbolForContent, {
    value: definition
  });

  return Object.freeze(context) as {
    name: string;
    cancel: () => boolean;
  } & typeof actions;
};

const getRegisteredContexts = (appName: string, phase: ContextPhase): InternalContext[] => {
  const register = getChildrenApp(appName)?.register;
  const content = phase === 'middleware' ? register?.middlewareContent : register?.responseContent;

  return content ? (Object.values(content.contexts)) : [];
};

const getContextPhases = (appName: string, definition: ContextDefinition): ContextPhase[] => {
  return (['middleware', 'response'] as const).filter(phase => {
    return getRegisteredContexts(appName, phase).some(context => context[contextDefinitionSymbolForContent] === definition);
  });
};

const isRegistered = (appName: string, definition: ContextDefinition, phase?: ContextPhase) => {
  const phases = getContextPhases(appName, definition);

  return phase ? phases.includes(phase) : phases.length > 0;
};

/** Validates phase ownership before an application registration is mounted. */
export const validateContextRegistration = (register?: {
  middlewareContent?: ContextConfiguration;
  responseContent?: ContextConfiguration;
}) => {
  const owners = new Map<ContextDefinition, ContextPhase>();

  for (const phase of ['middleware', 'response'] as const) {
    const content = phase === 'middleware' ? register?.middlewareContent : register?.responseContent;

    for (const context of (content ? Object.values(content.contexts) : []) as InternalContext[]) {
      const definition = context[contextDefinitionSymbolForContent];

      if (!definition) {
        throw new Error('Context registration only accepts contexts created by createContext');
      }
      if (owners.has(definition)) {
        throw new Error(`Context cannot be registered in multiple phases: ${definition.name}`);
      }
      owners.set(definition, phase);
    }
  }
};

/** Ends this context for the current event scope. */
const cancelContext = (definition: ContextDefinition): boolean => {
  const event = getCurrentEvent();

  if (!event || typeof event !== 'object') {
    throw new Error('Context actions must be called inside an event handler');
  }

  const appName = getCurrentAppName() ?? 'main';
  const key = getScopeKey(appName, definition, event);

  return removeActiveContext(key);
};

/** Opens a context for the current event. It never invokes a handler immediately. */
const dispatchContext = <T>(action: ContextDispatchAction<T>, event?: Events[EventKeys]) => {
  const internalAction = action as InternalContextAction;
  const metadata = internalAction[contextDefinitionSymbol];
  const definition = metadata?.definition;

  if (!definition) {
    throw new Error(`Invalid context action: ${action.type}`);
  }

  const handler = metadata.handler;
  const currentEvent = event ?? getCurrentEvent();

  if (!currentEvent || typeof currentEvent !== 'object') {
    throw new Error('Context actions must be dispatched with an event or inside an event handler');
  }

  const appName = getCurrentAppName() ?? 'main';

  const phases = getContextPhases(appName, definition);

  if (phases.length === 0) {
    throw new Error(`Context action is not registered for app: ${action.type}`);
  }
  if (phases.length > 1) {
    throw new Error(`Context is registered in multiple phases: ${action.type}`);
  }

  const key = getScopeKey(appName, definition, currentEvent);
  const previous = activeContexts.get(key) as ActiveContext | undefined;

  if (previous && definition.conflict === 'reject') {
    throw new Error(`Context is already active: ${action.type}`);
  }

  const now = Date.now();
  const id = `${now.toString(36)}-${Math.random().toString(36).slice(2)}`;
  const payload = clonePayload(action.payload);
  const expiresAt = definition.expiresIn ? now + definition.expiresIn : undefined;
  const controller = new AbortController();

  let expirationTimerId: string | undefined;
  const context: ActiveContext = {
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
      if (expirationTimerId) {
        scheduleCancel(expirationTimerId);
      }
    }
  };

  if (definition.expiresIn) {
    expirationTimerId = scheduleTimeout(() => {
      removeActiveContext(key, id);
    }, definition.expiresIn, appName);
  }

  putActiveContext(context);
};

/**
 * Runs a matching active context. `true` means the event was claimed, even when
 * it was explicitly passed on to the normal router.
 */
export const expendContext = async <T extends EventKeys>(event: Events[T], select: T, next: () => void, phase: ContextPhase) => {
  const now = Date.now();
  let current: ActiveContext | undefined;

  for (const key of getActiveContextKeys(select)) {
    const context = activeContexts.get(key) as ActiveContext | undefined;

    if (!context) {
      continue;
    }
    if (context.phase !== phase) {
      continue;
    }
    if (isExpired(context, now)) {
      removeActiveContext(key, context.id);
      continue;
    }

    if (!isRegistered(context.appName, context.definition, context.phase)) {
      removeActiveContext(key, context.id);
      continue;
    }

    let scopeKey: ScopeKey;

    try {
      scopeKey = getScopeKey(context.appName, context.definition, event);
    } catch {
      // This event does not expose every field required by this context's scope.
      continue;
    }

    if (scopeKey === key && (!current || context.order > current.order)) {
      current = context;
    }
  }

  if (!current) {
    next();

    return false;
  }

  const key = current.key;
  const previous = contextQueues.get(key) ?? Promise.resolve();
  const run: Promise<void> = previous
    .catch(() => undefined)
    .then(async () => {
      const active = activeContexts.get(key) as ActiveContext | undefined;

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
      const control: ContextAction = {
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
          phase: active.phase === 'middleware' ? 'middleware-content' : 'response-content'
        });
      } catch (error) {
        showErrorModule(error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Context handler failed'));

        const shouldContinue = await dispatchEventError({
          event,
          error,
          appName: active.appName,
          phase: active.phase === 'middleware' ? 'middleware-content' : 'response-content'
        });

        if (active.definition.onError === 'close') {
          removeActiveContext(active.key, active.id);
        }

        if (shouldContinue) {
          next();

          return;
        }

        finishCurrentTrace('error');

        return;
      }

      if (shouldClose) {
        removeActiveContext(active.key, active.id);
      }

      if (shouldPass) {
        next();
      } else {
        finishCurrentTrace('consumed');
      }
    })
    .finally(() => {
      if (contextQueues.get(key) === run) {
        contextQueues.delete(key);
      }
    });

  contextQueues.set(key, run);
  await run;

  return true;
};

/** Test and lifecycle utility for clearing in-memory active contexts. */
export const clearContexts = () => {
  clearActiveContexts();
  contextQueues.clear();
};

/** Clears every active context owned by an unloaded application. */
export const clearContextsByApp = (appName: string) => {
  clearActiveContextsByApp(appName);
};
