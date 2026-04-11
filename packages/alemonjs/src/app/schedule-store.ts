import { ScheduleId, ScheduleItem, ScheduleMap, ScheduleStatus, ScheduleCallback, CronExpression } from '../types/schedule';
import { ResultCode } from '../core/variable';
import { CronJob } from 'cron';

/**
 * 全局定时任务存储
 */
const scheduleMap: ScheduleMap = new Map();

// ============ 应用目录注册 (用于 stack-based 自动推断) ============

/**
 * appName -> mainDir 映射
 */
const appDirMap = new Map<string, string>();

/**
 * 注册应用目录，loadChild 加载时调用
 */
export const registerAppDir = (appName: string, mainDir: string) => {
  appDirMap.set(appName, mainDir);
};

/**
 * 注销应用目录，卸载时调用
 */
export const unregisterAppDir = (appName: string) => {
  appDirMap.delete(appName);
};

/**
 * 从 Error().stack 中提取调用者文件路径列表
 */
const extractCallerPaths = (): string[] => {
  const stack = new Error().stack;

  if (!stack) {
    return [];
  }

  const paths: string[] = [];
  // 匹配 file:///path 或 at /path 或 (path:line:col)
  const lineRegex = /(?:file:\/\/|\(|\s)(\/[^):]+)/g;
  let m: RegExpExecArray | null;

  while ((m = lineRegex.exec(stack)) !== null) {
    paths.push(m[1]);
  }

  return paths;
};

/**
 * 通过调用栈自动推断 appName
 * 遍历栈帧，找到第一个属于已注册应用目录的文件路径
 */
const resolveAppName = (): string => {
  const callerPaths = extractCallerPaths();

  for (const filePath of callerPaths) {
    for (const [name, dir] of appDirMap) {
      if (filePath.startsWith(dir)) {
        return name;
      }
    }
  }

  return 'main';
};

/**
 * 生成唯一 ID
 */
const generateId = (): ScheduleId => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
};

/**
 * 安全执行回调
 */
const safeInvoke = (callback: ScheduleCallback, id: ScheduleId, type: string) => {
  try {
    const result = callback();

    if (result instanceof Promise) {
      result.catch(err => {
        logger.error({
          code: ResultCode.Fail,
          message: `Schedule ${type} error [${id}]: ${err?.message ?? err}`,
          data: null
        });
      });
    }
  } catch (err: any) {
    logger.error({
      code: ResultCode.Fail,
      message: `Schedule ${type} error [${id}]: ${err?.message ?? err}`,
      data: null
    });
  }
};

// ============ 核心 API ============

/**
 * 注册 interval 定时任务
 */
export const scheduleInterval = (callback: ScheduleCallback, ms: number, appName?: string): ScheduleId => {
  if (ms <= 0) {
    throw new Error('Interval ms must be greater than 0');
  }

  const resolvedApp = appName ?? resolveAppName();
  const id = generateId();
  const timer = setInterval(() => {
    safeInvoke(callback, id, 'interval');
  }, ms);

  const item: ScheduleItem = {
    id,
    type: 'interval',
    status: 'active',
    callback,
    ms,
    _timer: timer,
    appName: resolvedApp,
    createdAt: Date.now()
  };

  scheduleMap.set(id, item);

  return id;
};

/**
 * 注册 timeout 定时任务 (一次性)
 */
export const scheduleTimeout = (callback: ScheduleCallback, ms: number, appName?: string): ScheduleId => {
  if (ms < 0) {
    throw new Error('Timeout ms must be >= 0');
  }

  const resolvedApp = appName ?? resolveAppName();
  const id = generateId();
  const timer = setTimeout(() => {
    safeInvoke(callback, id, 'timeout');

    const item = scheduleMap.get(id);

    if (item) {
      item.status = 'stopped';
      item._timer = null;
    }

    scheduleMap.delete(id);
  }, ms);

  const item: ScheduleItem = {
    id,
    type: 'timeout',
    status: 'active',
    callback,
    ms,
    _timer: timer,
    appName: resolvedApp,
    createdAt: Date.now()
  };

  scheduleMap.set(id, item);

  return id;
};

/**
 * 注册 cron 定时任务 (基于 cron 库的 CronJob)
 */
export const scheduleCron = (expression: CronExpression, callback: ScheduleCallback, appName?: string): ScheduleId => {
  const resolvedApp = appName ?? resolveAppName();
  const id = generateId();

  const job = CronJob.from({
    cronTime: expression,
    onTick: () => {
      safeInvoke(callback, id, 'cron');
    },
    start: true
  });

  const item: ScheduleItem = {
    id,
    type: 'cron',
    status: 'active',
    callback,
    cron: expression,
    _timer: job,
    appName: resolvedApp,
    createdAt: Date.now()
  };

  scheduleMap.set(id, item);

  return id;
};

/**
 * 清除定时器
 */
const clearTimer = (item: ScheduleItem) => {
  if (item._timer === null || item._timer === undefined) {
    return;
  }

  if (item.type === 'cron') {
    void (item._timer as CronJob).stop();
  } else if (item.type === 'interval') {
    clearInterval(item._timer);
  } else {
    clearTimeout(item._timer);
  }

  item._timer = null;
};

/**
 * 暂停定时任务
 */
export const schedulePause = (id: ScheduleId): boolean => {
  const item = scheduleMap.get(id);

  if (item?.status !== 'active') {
    return false;
  }

  clearTimer(item);
  item.status = 'paused';

  return true;
};

/**
 * 恢复定时任务
 */
export const scheduleResume = (id: ScheduleId): boolean => {
  const item = scheduleMap.get(id);

  if (item?.status !== 'paused') {
    return false;
  }

  if (item.type === 'interval' && item.ms) {
    item._timer = setInterval(() => {
      safeInvoke(item.callback, id, 'interval');
    }, item.ms);
    item.status = 'active';

    return true;
  }

  if (item.type === 'cron' && item.cron) {
    const job = CronJob.from({
      cronTime: item.cron,
      onTick: () => {
        safeInvoke(item.callback, id, 'cron');
      },
      start: true
    });

    item._timer = job;
    item.status = 'active';

    return true;
  }

  return false;
};

/**
 * 取消定时任务
 */
export const scheduleCancel = (id: ScheduleId): boolean => {
  const item = scheduleMap.get(id);

  if (!item) {
    return false;
  }

  clearTimer(item);
  item.status = 'stopped';
  scheduleMap.delete(id);

  return true;
};

/**
 * 按应用名取消所有定时任务
 */
export const scheduleCancelByApp = (appName: string): number => {
  let count = 0;

  for (const [id, item] of scheduleMap) {
    if (item.appName === appName) {
      scheduleCancel(id);
      count++;
    }
  }

  return count;
};

/**
 * 取消所有定时任务
 */
export const scheduleCancelAll = (): number => {
  let count = 0;

  for (const [id] of scheduleMap) {
    scheduleCancel(id);
    count++;
  }

  return count;
};

/**
 * 获取所有定时任务列表
 */
export const scheduleList = (
  appName?: string
): Array<{
  id: ScheduleId;
  type: ScheduleItem['type'];
  status: ScheduleStatus;
  ms?: number;
  cron?: string;
  appName?: string;
  createdAt: number;
}> => {
  const result: Array<{
    id: ScheduleId;
    type: ScheduleItem['type'];
    status: ScheduleStatus;
    ms?: number;
    cron?: string;
    appName?: string;
    createdAt: number;
  }> = [];

  for (const [, item] of scheduleMap) {
    if (appName && item.appName !== appName) {
      continue;
    }

    result.push({
      id: item.id,
      type: item.type,
      status: item.status,
      ms: item.ms,
      cron: item.cron,
      appName: item.appName,
      createdAt: item.createdAt
    });
  }

  return result;
};
