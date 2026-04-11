/**
 * 定时任务类型定义
 */

/**
 * 定时任务 ID
 */
export type ScheduleId = string;

/**
 * 定时任务类型
 */
export type ScheduleType = 'interval' | 'timeout' | 'cron';

/**
 * 定时任务状态
 */
export type ScheduleStatus = 'active' | 'paused' | 'stopped';

/**
 * Cron 表达式字段
 * 支持: 秒 分 时 日 月 周 (6位) 或 分 时 日 月 周 (5位)
 */
export type CronExpression = string;

/**
 * 定时任务回调
 */
export type ScheduleCallback = () => void | Promise<void>;

/**
 * 定时任务项
 */
export interface ScheduleItem {
  /** 任务 ID */
  id: ScheduleId;
  /** 任务类型 */
  type: ScheduleType;
  /** 任务状态 */
  status: ScheduleStatus;
  /** 回调 */
  callback: ScheduleCallback;
  /** 间隔时间 (ms)，用于 interval/timeout */
  ms?: number;
  /** Cron 表达式，用于 cron */
  cron?: CronExpression;
  /** 内部定时器句柄 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _timer?: any;
  /** 所属应用名称 */
  appName?: string;
  /** 创建时间 */
  createdAt: number;
}

/**
 * 定时任务存储映射
 */
export type ScheduleMap = Map<ScheduleId, ScheduleItem>;

/**
 * 生命周期注入的定时任务工具
 */
export interface ScheduleTools {
  /**
   * 注册间隔定时任务
   * @param callback - 定时回调
   * @param ms - 间隔毫秒
   * @returns 任务 ID
   */
  setInterval: (callback: ScheduleCallback, ms: number) => ScheduleId;
  /**
   * 注册一次性延迟任务
   * @param callback - 回调
   * @param ms - 延迟毫秒
   * @returns 任务 ID
   */
  setTimeout: (callback: ScheduleCallback, ms: number) => ScheduleId;
  /**
   * 注册 cron 表达式定时任务
   * @param expression - cron 表达式 (5位: 分 时 日 月 周)
   * @param callback - 回调
   * @returns 任务 ID
   */
  setCron: (expression: CronExpression, callback: ScheduleCallback) => ScheduleId;
  /**
   * 取消定时任务
   * @param id - 任务 ID
   * @returns 是否成功
   */
  cancel: (id: ScheduleId) => boolean;
}
