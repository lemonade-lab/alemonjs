import { runtimeScope, runtimeExecution, type RuntimeScope, type RuntimeExecution } from '../common/runtime-scope.js';
import { getConfig, type ConfigValue } from '../common/config.js';
import { createResult } from '../common/utils.js';
import { ResultCode } from '../common/variable.js';
import type {
  OutgoingMessage,
  ActionTarget,
  Actions,
  Apis,
  EventKeys,
  Events,
  childrenCallbackRes,
  ChildrenCycle,
  DefineChildrenValue
} from '../types/index.js';
import { ChildrenApp, listChildrenApps } from '../application/runtime/store.js';
import { withEventContext, withProcessorTrace, finishCurrentTrace } from '../application/runtime/hook-event-context.js';
import { onProcessor } from '../application/runtime/event-processor.js';
import { validateContextRegistration, clearContexts } from '../application/context.js';
import { scheduleCancelAll, scheduleCancelByApp } from '../application/runtime/schedule-store.js';
import { registerExpose } from '../application/expose.js';
import { dispatchAppDispose, dispatchAppReady } from '../application/runtime/lifecycle-callbacks.js';
import type { Result } from '../common/utils.js';
import { createTestEvents } from './events.js';
import { createTestClock } from './clock.js';
import { inspectMessage, type TestMessage } from './messages.js';

export { createTestEvents } from './events.js';
export type { TestEventOptions } from './events.js';
export { inspectMessage } from './messages.js';
export type { TestMessage } from './messages.js';

export type TestActionRecord = {
  kind: 'action' | 'api';
  name: string;
  request: Actions | Apis;
  results?: Result[];
  error?: unknown;
};
export type TestRunResult<T = unknown> = {
  value: T;
  actions: TestActionRecord[];
  messages: TestMessage[];
  nextCalls: boolean[][];
  errors: unknown[];
  reasons: string[];
  context: { claimed: boolean };
};
export type TestAppOptions = {
  config?: ConfigValue;
  /** Real milliseconds; never controlled by the virtual clock. */
  timeoutMs?: number;
  /** Defaults to a virtual framework clock starting at zero. false uses real time. */
  clock?: false | { now?: number };
  /** Unhandled framework errors reject runs by default. */
  failOnError?: boolean;
};
export type TestHandler =
  | ((event: any, next: (...args: boolean[]) => void) => unknown)
  | {
      select?: EventKeys | readonly EventKeys[];
      current: TestHandler | readonly TestHandler[];
    }
  | { default: TestHandler };

type MockHandler<T> = (request: T) => Result[] | Promise<Result[]>;

export type TestActionRequest<Name extends string> = [Extract<Actions, { action: Name }>] extends [never] ? Actions : Extract<Actions, { action: Name }>;
export type TestActionController = {
  on<Name extends string>(name: Name, handler: MockHandler<TestActionRequest<Name>>): void;
  remove(name: string): void;
  readonly calls: TestActionRecord[];
};

/** Snapshot values without mutating Format instances or retaining mutable events. */
function snapshot<T>(value: T, seen = new WeakMap<object, any>()): T {
  if (!value || typeof value !== 'object') {
    return value;
  }
  if (Buffer.isBuffer(value)) {
    return Buffer.from(value) as T;
  }
  if (value instanceof Uint8Array) {
    return value.slice() as T;
  }
  if (value instanceof Date) {
    return new Date(value) as T;
  }
  if (seen.has(value)) {
    return seen.get(value);
  }
  const copy: any = Array.isArray(value) ? [] : {};

  seen.set(value, copy);
  for (const key of Object.keys(value)) {
    if (typeof value[key] !== 'function') {
      copy[key] = snapshot(value[key], seen);
    }
  }

  return copy;
}

/** Offline test harness. No platform connections, config files, or module mocking. */
export function createTestApp(options: TestAppOptions = {}) {
  const timeoutMs = options.timeoutMs ?? 5000;

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error('timeoutMs must be positive and finite');
  }
  const clock = createTestClock(options.clock === false ? Date.now() : options.clock?.now ?? 0);
  const records: TestActionRecord[] = [];
  const executionRecords = new WeakMap<RuntimeExecution, TestActionRecord[]>();
  const executionMessages = new WeakMap<RuntimeExecution, TestMessage[]>();
  const actionHandlers = new Map<string, MockHandler<Actions>>();
  const apiHandlers = new Map<string, MockHandler<Apis>>();
  const active = new Set<Promise<unknown>>();
  let disposed = false;
  let disposePromise: Promise<void> | undefined;
  let mounting = false;
  const scope: RuntimeScope = {
    resources: new Map(),
    cleanups: new Set(),
    disposed: false,
    now: options.clock === false ? Date.now : clock.now,
    timers: options.clock === false ? undefined : clock.timers,
    action: request => perform('action', request),
    api: request => perform('api', request)
  };
  const inScope = <T>(callback: () => T): T => runtimeScope.run(scope, callback);
  const assertOpen = () => {
    if (disposed) {
      throw new Error('Test app is disposed');
    }
  };
  const events = createTestEvents(scope.now);

  inScope(() => getConfig().saveValue(snapshot(options.config ?? {})));

  // Only message delivery has a default success receipt. All other actions are explicit.
  actionHandlers.set('message.send', () => [createResult(ResultCode.Ok, 'Test delivery', { id: `test-receipt-${records.length}` })]);

  async function perform(kind: 'action' | 'api', request: Actions | Apis): Promise<Result[]> {
    const execution = runtimeExecution.getStore();
    const name = kind === 'api' ? (request as Apis).payload.key : request.action;
    const record: TestActionRecord = { kind, name, request: snapshot(request) };

    records.push(record);
    let index = -1;

    if (execution) {
      index = (executionRecords.get(execution)?.push(record) ?? 0) - 1;
    }
    const payload = request.payload as any;

    if (kind === 'action' && request.action.startsWith('message.send')) {
      const nodes = snapshot(payload.params?.format?.value ?? payload.params?.format ?? []);
      const content = snapshot(payload.params?.content) as OutgoingMessage | undefined;
      const inspected = inspectMessage(nodes);
      const message: TestMessage = {
        nodes,
        content,
        ...inspected,
        target: snapshot(payload.target as ActionTarget | undefined),
        actionIndex: index
      };

      if (content !== undefined && nodes.length === 0) {
        // Semantic content has its own schema; preserve it rather than guessing Format nodes.
        message.text = typeof content === 'string' ? content : content?.text ?? content?.markdown?.content ?? '';
        message.commands =
          content?.keyboard?.rows?.flatMap(row => row.filter(button => button.action.type === 'command').map(button => button.action.data)) ?? [];
      }
      if (execution) {
        executionMessages.get(execution)?.push(message);
      }
    }
    const handler = kind === 'action' ? actionHandlers.get(name) : apiHandlers.get(name);

    if (!handler) {
      const error = new Error(`Unmocked ${kind}: ${name}`);

      execution?.errors.push(error);
      record.error = error;
      throw error;
    }
    try {
      const results = await handler(request as Actions & Apis);

      if (!Array.isArray(results) || results.some(item => !item || typeof item.code !== 'number')) {
        const error = new Error(`Invalid mock results for ${name}: expected Result[]`);

        execution?.errors.push(error);
        throw error;
      }
      record.results = snapshot(results);

      return results;
    } catch (error) {
      record.error = error;
      throw error;
    }
  }

  async function drain(execution: RuntimeExecution) {
    // Detached framework tasks can enqueue further actions while settling.
    while (execution.pending.size) {
      await Promise.allSettled([...execution.pending]);
    }
  }

  function execute<T>(
    event: Events[EventKeys] | undefined,
    runner: (next: (...args: boolean[]) => void) => T | Promise<T>,
    appName = 'main'
  ): Promise<TestRunResult<Awaited<T>>> {
    assertOpen();
    const execution: RuntimeExecution = { appName, pending: new Set(), errors: [], reasons: [], contextClaimed: false };
    const actions: TestActionRecord[] = [];
    const messages: TestMessage[] = [];
    const nextCalls: boolean[][] = [];

    executionRecords.set(execution, actions);
    executionMessages.set(execution, messages);
    const next = (...args: boolean[]) => {
      nextCalls.push(args);
    };
    const task = inScope(() =>
      runtimeExecution.run(execution, async () => {
        let timer: ReturnType<typeof setTimeout>;
        const work = async () => {
          let value: Awaited<T>;

          try {
            value = await (event ? withEventContext(event, next, () => runner(next), { appName, phase: 'response' }) : runner(next));
          } catch (error) {
            execution.errors.push(error);
          }
          await drain(execution);
          if (event) {
            finishCurrentTrace(execution.errors.length ? 'error' : 'completed');
          }
          await drain(execution);
          const errors = [...new Set(execution.errors)];

          if (errors.length && options.failOnError !== false) {
            throw new AggregateError(
              errors,
              `Test execution failed: ${errors.map(error => (error instanceof Error ? error.message : String(error))).join('; ')}`
            );
          }

          return { value: value, actions, messages, nextCalls, errors, reasons: execution.reasons, context: { claimed: execution.contextClaimed } };
        };

        try {
          return await Promise.race([
            event ? withProcessorTrace(event.name, event, work) : work(),
            new Promise<never>((_resolve, reject) => {
              timer = setTimeout(() => reject(new Error(`Test execution timed out after ${timeoutMs}ms`)), timeoutMs);
            })
          ]);
        } finally {
          clearTimeout(timer);
          execution.closed = true;
        }
      })
    );

    active.add(task);
    void task.then(
      () => active.delete(task),
      () => active.delete(task)
    );

    return task;
  }

  const mockController = <T>(handlers: Map<string, MockHandler<T>>) => ({
    on(name: string, handler: MockHandler<T>) {
      assertOpen();
      handlers.set(name, handler);
    },
    remove(name: string) {
      assertOpen();
      handlers.delete(name);
    },
    get calls() {
      return records.filter(record => ((handlers as unknown) === actionHandlers ? record.kind === 'action' : record.kind === 'api'));
    }
  });

  return {
    events,
    actions: mockController(actionHandlers) as TestActionController,
    apis: mockController(apiHandlers),
    /** Lifetime action log; each run also returns its own isolated records. */
    get calls() {
      return records.slice();
    },
    clock: {
      now: scope.now,
      get pending() {
        return clock.pending;
      },
      advance: (ms: number) => {
        if (options.clock === false) {
          throw new Error('Cannot advance a real clock');
        }

        return execute(undefined, () => clock.advance(ms));
      }
    },
    configure(config: ConfigValue) {
      assertOpen();
      inScope(() => getConfig().saveValue(snapshot(config)));
    },
    /** Explicit escape hatch for importing/creating app-owned services inside this scope. */
    run<T>(callback: () => T): T {
      assertOpen();

      return inScope(callback);
    },
    invoke<T>(event: Events[EventKeys], callback: () => T | Promise<T>, appName = 'main') {
      return execute(event, callback, appName);
    },
    runHandler(handler: TestHandler, event: Events[EventKeys], appName = 'main') {
      return execute(
        event,
        next => {
          let forwarded = false;
          const forward = (...args: boolean[]) => {
            forwarded = true;
            next(...args);
          };
          const visit = async (current: TestHandler): Promise<unknown> => {
            if (typeof current === 'function') {
              return withEventContext(event, forward, () => current(event, forward), { appName, phase: 'response' });
            }
            if (!current || typeof current !== 'object') {
              throw new TypeError('Expected a function or onResponse/onMiddleware handler; mount route definitions instead');
            }
            if ('default' in current) {
              return visit(current.default);
            }
            if (current.select && !(Array.isArray(current.select) ? current.select : [current.select]).includes(event.name)) {
              return undefined;
            }
            if (Array.isArray(current.current)) {
              for (const child of current.current) {
                const value = await visit(child);

                if (forwarded || value !== true) {
                  return value;
                }
              }

              return true;
            }

            return visit(current.current as TestHandler);
          };

          return visit(handler);
        },
        appName
      );
    },
    async mount(definition: NonNullable<childrenCallbackRes> | DefineChildrenValue, lifecycle: ChildrenCycle = {}, name = 'main') {
      assertOpen();
      if (mounting || active.size) {
        throw new Error('Mount apps before starting event executions');
      }
      mounting = true;
      try {
        await execute(
          undefined,
          async () => {
            if (listChildrenApps().some(app => app.name === name)) {
              throw new Error(`App already mounted: ${name}`);
            }
            let register: NonNullable<childrenCallbackRes>;
            let cycle = lifecycle;
            const app = new ChildrenApp(name);

            try {
              if ('_name' in definition && definition._name === 'app') {
                const callbacks = typeof definition.callback === 'function' ? await definition.callback() : definition.callback;

                cycle = { ...callbacks, ...lifecycle };
                await cycle.onCreated?.();
                register = (await callbacks.register?.()) ?? {};
              } else {
                register = definition as NonNullable<childrenCallbackRes>;
                await cycle.onCreated?.();
              }
              validateContextRegistration(register);

              app.register(register);
              app.pushCycle(cycle);
              app.on();
              if (register.expose) {
                registerExpose(name, register.expose.getConfigs());
              }
              const store = { response: [], responseMiddleware: {}, middleware: [] };

              await cycle.onMounted?.(store);
              await dispatchAppReady(name, store);
            } catch (error) {
              // Creation/registration can allocate resources before the app is mounted.
              app.pushCycle(cycle);
              app.on();
              await dispatchAppDispose(name, error);
              scheduleCancelByApp(name);
              app.un();
              throw error;
            }
          },
          name
        );
      } finally {
        mounting = false;
      }
    },
    /** Production processor: filtering, subscriptions, middleware, Context and routes. */
    dispatch(event: Events[EventKeys]) {
      return execute(event, () => onProcessor(event.name, event));
    },
    async unmount(name = 'main') {
      assertOpen();
      if (active.size) {
        throw new Error('Wait for event executions before unmounting');
      }
      await execute(
        undefined,
        async () => {
          await dispatchAppDispose(name);
          scheduleCancelByApp(name);
          new ChildrenApp(name).un();
        },
        name
      );
    },
    dispose(): Promise<void> {
      if (disposePromise !== undefined) {
        return disposePromise;
      }
      disposed = true;
      disposePromise = (async () => {
        await Promise.allSettled([...active]);
        let timer: ReturnType<typeof setTimeout>;

        try {
          await Promise.race([
            inScope(async () => {
              for (const app of listChildrenApps()) {
                await dispatchAppDispose(app.name);
                new ChildrenApp(app.name).un();
              }
            }),
            new Promise<never>((_resolve, reject) => {
              timer = setTimeout(() => reject(new Error('Test app disposal timed out')), timeoutMs);
            })
          ]);
        } finally {
          clearTimeout(timer);
          inScope(() => {
            for (const cleanup of scope.cleanups) {
              cleanup();
            }
            scope.cleanups.clear();
            clearContexts();
            scheduleCancelAll();
            clock.clear();
            getConfig().dispose();
          });
          scope.disposed = true;
          scope.resources.clear();
        }
      })();

      return disposePromise;
    }
  };
}
