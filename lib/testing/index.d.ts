import { Result } from "../common/result.js";
import { User } from "../types/event/base/user.js";
import { Channel, Guild } from "../types/event/base/guild.js";
import { Message, MessageMedia, MessageOpen, MessageText } from "../types/event/base/message.js";
import { Actions } from "../types/actions.js";
import { StandardEventDetails } from "../types/messaging.js";
import { Expansion } from "../types/event/base/expansion.js";
import { Interaction } from "../types/event/base/interaction.js";
import { AutoFields } from "../types/event/base/auto.js";
import { EventKeys, Events } from "../types/event/map.js";
import { DefineChildrenValue, childrenCallbackRes } from "../types/event/index.js";
import { ChildrenCycle } from "../types/cycle/index.js";
import { Apis } from "../types/apis.js";
import "../types/index.js";
import { ConfigValue } from "../common/config.js";
import "../index.js";
import { TestEventOptions, createTestEvents } from "./events.js";
import { TestMessage, inspectMessage } from "./messages.js";
//#region src/testing/index.d.ts
type TestActionRecord = {
  kind: 'action' | 'api';
  name: string;
  request: Actions | Apis;
  results?: Result[];
  error?: unknown;
};
type TestRunResult<T = unknown> = {
  value: T;
  actions: TestActionRecord[];
  messages: TestMessage[];
  nextCalls: boolean[][];
  errors: unknown[];
  reasons: string[];
  context: {
    claimed: boolean;
  };
};
type TestAppOptions = {
  config?: ConfigValue;
  /** Real milliseconds; never controlled by the virtual clock. */
  timeoutMs?: number;
  /** Defaults to a virtual framework clock starting at zero. false uses real time. */
  clock?: false | {
    now?: number;
  };
  /** Unhandled framework errors reject runs by default. */
  failOnError?: boolean;
};
type TestHandler = ((event: any, next: (...args: boolean[]) => void) => unknown) | {
  select?: EventKeys | readonly EventKeys[];
  current: TestHandler | readonly TestHandler[];
} | {
  default: TestHandler;
};
type MockHandler<T> = (request: T) => Result[] | Promise<Result[]>;
type TestActionRequest<Name extends string> = [Extract<Actions, {
  action: Name;
}>] extends [never] ? Actions : Extract<Actions, {
  action: Name;
}>;
type TestActionController = {
  on<Name extends string>(name: Name, handler: MockHandler<TestActionRequest<Name>>): void;
  remove(name: string): void;
  readonly calls: TestActionRecord[];
};
/** Offline test harness. No platform connections, config files, or module mocking. */
declare function createTestApp(options?: TestAppOptions): {
  events: {
    event: <T extends EventKeys>(name: T, overrides?: Partial<Events[T]>) => Events[T];
    groupMessage: (options?: TestEventOptions, overrides?: Partial<Events['message.create']>) => MessageText & MessageMedia & MessageOpen & StandardEventDetails & {
      Platform: string;
      value: any;
      BotId?: string;
      IsAtMe?: boolean;
      IsPrivate?: boolean;
    } & Guild & Channel & Message & User & {
      name: 'message.create';
    } & Expansion & AutoFields;
    channelMessage: (options?: TestEventOptions, overrides?: Partial<Events['message.create']>) => MessageText & MessageMedia & MessageOpen & StandardEventDetails & {
      Platform: string;
      value: any;
      BotId?: string;
      IsAtMe?: boolean;
      IsPrivate?: boolean;
    } & Guild & Channel & Message & User & {
      name: 'message.create';
    } & Expansion & AutoFields;
    privateMessage: (options?: TestEventOptions, overrides?: Partial<Events['private.message.create']>) => MessageText & MessageMedia & MessageOpen & StandardEventDetails & {
      Platform: string;
      value: any;
      BotId?: string;
      IsAtMe?: boolean;
      IsPrivate?: boolean;
    } & Message & User & {
      name: 'private.message.create';
    } & Expansion & AutoFields;
    interaction: (options?: TestEventOptions & {
      private?: boolean;
    }, overrides?: Partial<Events['interaction.create']>) => (MessageText & Interaction & MessageOpen & StandardEventDetails & {
      Platform: string;
      value: any;
      BotId?: string;
      IsAtMe?: boolean;
      IsPrivate?: boolean;
    } & Message & User & {
      name: 'private.interaction.create';
    } & Expansion & AutoFields) | (MessageText & Interaction & MessageOpen & StandardEventDetails & {
      Platform: string;
      value: any;
      BotId?: string;
      IsAtMe?: boolean;
      IsPrivate?: boolean;
    } & Guild & Channel & Message & User & {
      name: 'interaction.create';
    } & Expansion & AutoFields);
  };
  actions: TestActionController;
  apis: {
    on(name: string, handler: MockHandler<Apis>): void;
    remove(name: string): void;
    readonly calls: TestActionRecord[];
  };
  /** Lifetime action log; each run also returns its own isolated records. */
  readonly calls: TestActionRecord[];
  clock: {
    now: () => number;
    readonly pending: number;
    advance: (ms: number) => Promise<TestRunResult<void>>;
  };
  configure(config: ConfigValue): void;
  /** Explicit escape hatch for importing/creating app-owned services inside this scope. */
  run<T>(callback: () => T): T;
  invoke<T>(event: Events[EventKeys], callback: () => T | Promise<T>, appName?: string): Promise<TestRunResult<Awaited<T>>>;
  runHandler(handler: TestHandler, event: Events[EventKeys], appName?: string): Promise<TestRunResult<unknown>>;
  mount(definition: NonNullable<childrenCallbackRes> | DefineChildrenValue, lifecycle?: ChildrenCycle, name?: string): Promise<void>;
  /** Production processor: filtering, subscriptions, middleware, Context and routes. */
  dispatch(event: Events[EventKeys]): Promise<TestRunResult<void>>;
  unmount(name?: string): Promise<void>;
  dispose(): Promise<void>;
};
//#endregion
export { TestActionController, TestActionRecord, TestActionRequest, TestAppOptions, type TestEventOptions, TestHandler, type TestMessage, TestRunResult, createTestApp, createTestEvents, inspectMessage };