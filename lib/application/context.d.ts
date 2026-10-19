import { EventKeys, Events } from "../types/event/map.js";
import "../types/index.js";
//#region src/application/context.d.ts
type ContextState = Record<string, unknown>;
type ContextAction<T = unknown> = {
  /** Payload supplied when the context was opened. */
  readonly payload: T;
  /** Aborts when this context is replaced, closed, expired, or unloaded. */
  readonly signal: AbortSignal;
  /** Keep the context but allow this event to enter the normal router. */
  pass: () => void;
  /** Remove the context after the current event finishes. */
  close: () => void;
};
type ContextHandler<S extends ContextState, T = unknown> = (event: Events[EventKeys], state: S, action: ContextAction<T>) => void | Promise<void>;
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
type Context = {
  name: string;
  [handler: string]: unknown;
};
type ContextConfiguration = {
  contexts: Record<string, Context>;
};
type ContextPhase = 'middleware' | 'response';
/**
 * Creates the context configuration consumed by defineChildren().register().
 * The wrapper leaves room for future context-level options without changing
 * the responseContent registration shape.
 */
declare const configureContext: (config: ContextConfiguration) => ContextConfiguration;
/**
 * Creates a statically registered, event-driven context.
 * Calling one of its handlers only opens a context; handlers run on later events.
 */
declare const createContext: <S extends ContextState, R extends Record<string, ContextHandler<S, any>>>(config: ContextConfig<S, R>) => {
  name: string;
  cancel: () => boolean;
} & { [K in keyof R]: (payload?: unknown) => void; };
/** Validates phase ownership before an application registration is mounted. */
declare const validateContextRegistration: (register?: {
  middlewareContent?: ContextConfiguration;
  responseContent?: ContextConfiguration;
}) => void;
/**
 * Runs a matching active context. `true` means the event was claimed, even when
 * it was explicitly passed on to the normal router.
 */
declare const expendContext: <T extends EventKeys>(event: Events[T], select: T, next: () => void, phase: ContextPhase) => Promise<boolean>;
/** Test and lifecycle utility for clearing in-memory active contexts. */
declare const clearContexts: () => void;
/** Clears every active context owned by an unloaded application. */
declare const clearContextsByApp: (appName: string) => void;
//#endregion
export { Context, ContextAction, ContextConfiguration, ContextHandler, ContextPhase, clearContexts, clearContextsByApp, configureContext, createContext, expendContext, validateContextRegistration };