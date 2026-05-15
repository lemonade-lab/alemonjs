import { StoreMiddlewareItem, StoreResponseItem } from '../store/res';
import type { Events } from '../event/map';
import { EventKeys } from '../event/map';
import type KoaRouter from 'koa-router';
type StroreParam = {
  response: StoreResponseItem[];
  responseMiddleware: {
    [key: string]: StoreResponseItem;
  };
  middleware: StoreMiddlewareItem[];
};

export type EventErrorPhase = 'middleware' | 'response' | 'subscribe' | 'route';
export type EventTraceReason = 'filtered' | 'completed' | 'consumed' | 'error';
export type RuntimeLifecycleStatus = 'discovered' | 'loading' | 'ready' | 'failed' | 'disposed';

export type EventStartContext<T extends EventKeys = EventKeys> = {
  event: Events[T];
  name: T;
};

export type EventFinishedContext<T extends EventKeys = EventKeys> = {
  event: Events[T];
  name: T;
  reason: EventTraceReason;
  duration: number;
  hasSendAttempted: boolean;
  hasSendSucceeded: boolean;
  lastSendError: string | null;
};

export type EventErrorContext<T extends EventKeys = EventKeys> = {
  event: Events[T];
  error: unknown;
  appName: string;
  phase: EventErrorPhase;
};

export type HttpErrorKind = 'api' | 'web' | 'koa-router';

export type HttpErrorContext = {
  ctx: KoaRouter.RouterContext;
  error: unknown;
  appName: string;
  path: string;
  method: string;
  kind: HttpErrorKind;
};

export type RuntimeStatusChangeContext = {
  appName: string;
  previousStatus?: RuntimeLifecycleStatus;
  status: RuntimeLifecycleStatus;
  error?: {
    message: string;
    time: number;
  };
};

/**
 * 子模块生命周期
 */
export type ChildrenCycle = {
  /**
   * 创建时
   * @returns
   */
  onCreated?: () => void | Promise<void>;
  /**
   * 挂载时。得到属于自己的 store。
   * 兼容旧语义：这是初始化阶段的一部分，会在 ready 前被等待完成。
   * 推荐把“真正对外可服务后的逻辑”写入 onReady。
   * @returns
   */
  onMounted?: (store: StroreParam) => void | Promise<void>;
  /**
   * 应用即将进入 ready 状态前触发。
   * 在 onMounted 之后执行，抛错会阻止进入 ready。
   */
  onReady?: (store: StroreParam) => void | Promise<void>;
  /**
   * 事件进入主处理链时触发。
   * 仅用于通知、埋点、轻量上下文注入，不参与流程决策。
   */
  onEventStart?: <T extends EventKeys>(context: EventStartContext<T>) => void | Promise<void>;
  /**
   * 事件处理阶段发生错误时触发。
   * 返回 'continue' 表示继续当前链路，其它返回值都视为终止。
   */
  onEventError?: <T extends EventKeys>(context: EventErrorContext<T>) => void | 'continue' | Promise<void | 'continue'>;
  /**
   * 事件生命周期结束时触发。
   */
  onEventFinished?: <T extends EventKeys>(context: EventFinishedContext<T>) => void | Promise<void>;
  /**
   * HTTP 能力执行出错时触发。
   * 返回 'handled' 表示已由应用自行处理响应。
   */
  onHttpError?: (context: HttpErrorContext) => void | 'handled' | Promise<void | 'handled'>;
  /**
   * 当前应用的运行时状态变化时触发。
   */
  onRuntimeStatusChange?: (context: RuntimeStatusChangeContext) => void | Promise<void>;
  /**
   * 卸载时。
   * 兼容旧语义：这是销毁阶段的旧钩子，可能在失败卸载或进程退出时触发。
   * 推荐把统一清理逻辑写入 onDispose。
   * @returns
   */
  unMounted?: (error: any) => void | Promise<void>;
  /**
   * 应用销毁阶段触发。
   */
  onDispose?: (error?: unknown) => void | Promise<void>;
};

/**
 * 控制生命周期
 * ***
 * next() 在同一个周期中继续
 * ***
 * next(true) 在下一个周期中继续
 * ***
 * next(true,true) 在下下个周期中继续
 * 以此类推。。。
 */
export type Next = (...cns: boolean[]) => void;

/**
 * 事件周期
 */
export type EventCycleEnum = 'create' | 'mount' | 'unmount';
