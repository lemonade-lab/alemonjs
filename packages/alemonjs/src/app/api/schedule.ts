import { ScheduleCallback, CronExpression } from '../../types/schedule';
import { scheduleInterval, scheduleTimeout, scheduleCron, scheduleCancel, schedulePause, scheduleResume, scheduleList } from '../schedule-store';

/**
 * 替代原生 setInterval，由框架统一管理。
 * 框架内部通过调用栈自动识别所属插件，卸载时自动清理。
 *
 * @param callback - 定时回调
 * @param ms - 间隔毫秒
 * @returns 任务 ID
 *
 * @example
 * ```ts
 * import { setInterval } from 'alemonjs';
 * setInterval(() => console.log('tick'), 5000);
 * ```
 */
export const setInterval = (callback: ScheduleCallback, ms: number) => scheduleInterval(callback, ms);

/**
 * 替代原生 setTimeout，由框架统一管理。
 * 框架内部通过调用栈自动识别所属插件，执行后自动清理。
 *
 * @param callback - 回调
 * @param ms - 延迟毫秒
 * @returns 任务 ID
 *
 * @example
 * ```ts
 * import { setTimeout } from 'alemonjs';
 * setTimeout(() => console.log('once'), 10000);
 * ```
 */
export const setTimeout = (callback: ScheduleCallback, ms: number) => scheduleTimeout(callback, ms);

/**
 * 注册 cron 表达式定时任务，由框架统一管理。
 * 框架内部通过调用栈自动识别所属插件，卸载时自动清理。
 *
 * @param expression - cron 表达式 (5位: 分 时 日 月 周)
 * @param callback - 回调
 * @returns 任务 ID
 *
 * @example
 * ```ts
 * import { setCron } from 'alemonjs';
 * setCron('0 8 * * *', () => console.log('morning'));
 * ```
 */
export const setCron = (expression: CronExpression, callback: ScheduleCallback) => scheduleCron(expression, callback);

/**
 * 替代原生 clearInterval，取消框架管理的间隔定时任务
 * @param id - 任务 ID
 */
export const clearInterval = scheduleCancel;

/**
 * 替代原生 clearTimeout，取消框架管理的延迟任务
 * @param id - 任务 ID
 */
export const clearTimeout = scheduleCancel;

/**
 * 暂停定时任务
 * @param id - 任务 ID
 */
export const pauseSchedule = schedulePause;

/**
 * 恢复定时任务
 * @param id - 任务 ID
 */
export const resumeSchedule = scheduleResume;

/**
 * 列出定时任务
 * @param appName - 可选，按应用名过滤
 */
export const listSchedule = scheduleList;
