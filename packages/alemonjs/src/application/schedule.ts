import { ScheduleCallback, CronExpression } from '../types/schedule';
import { scheduleInterval, scheduleTimeout, scheduleCron, scheduleCancel, schedulePause, scheduleResume, scheduleList } from './runtime/schedule-store.js';

/**
 * 替代原生 setInterval，由框架统一管理。
 * 框架内部通过调用栈自动识别所属插件，卸载时自动清理。
 */
export const setInterval = (callback: ScheduleCallback, ms: number) => scheduleInterval(callback, ms);

/**
 * 替代原生 setTimeout，由框架统一管理。
 * 框架内部通过调用栈自动识别所属插件，执行后自动清理。
 */
export const setTimeout = (callback: ScheduleCallback, ms: number) => scheduleTimeout(callback, ms);

/**
 * 注册 cron 表达式定时任务，由框架统一管理。
 * 框架内部通过调用栈自动识别所属插件，卸载时自动清理。
 */
export const setCron = (expression: CronExpression, callback: ScheduleCallback) => scheduleCron(expression, callback);

/**
 * 替代原生 clearInterval，取消框架管理的间隔定时任务
 */
export const clearInterval = scheduleCancel;

/**
 * 替代原生 clearTimeout，取消框架管理的延迟任务
 */
export const clearTimeout = scheduleCancel;

/**
 * 暂停定时任务
 */
export const pauseSchedule = schedulePause;

/**
 * 恢复定时任务
 */
export const resumeSchedule = scheduleResume;

/**
 * 列出定时任务
 */
export const listSchedule = scheduleList;
