import { CronExpression, ScheduleCallback } from "../types/schedule/index.js";
import { scheduleCancel, scheduleList, schedulePause, scheduleResume } from "./runtime/schedule-store.js";
//#region src/application/schedule.d.ts
/**
 * 替代原生 setInterval，由框架统一管理。
 * 框架内部通过调用栈自动识别所属插件，卸载时自动清理。
 */
declare const setInterval: (callback: ScheduleCallback, ms: number) => string;
/**
 * 替代原生 setTimeout，由框架统一管理。
 * 框架内部通过调用栈自动识别所属插件，执行后自动清理。
 */
declare const setTimeout: (callback: ScheduleCallback, ms: number) => string;
/**
 * 注册 cron 表达式定时任务，由框架统一管理。
 * 框架内部通过调用栈自动识别所属插件，卸载时自动清理。
 */
declare const setCron: (expression: CronExpression, callback: ScheduleCallback) => string;
/**
 * 替代原生 clearInterval，取消框架管理的间隔定时任务
 */
declare const clearInterval: typeof scheduleCancel;
/**
 * 替代原生 clearTimeout，取消框架管理的延迟任务
 */
declare const clearTimeout: typeof scheduleCancel;
/**
 * 暂停定时任务
 */
declare const pauseSchedule: typeof schedulePause;
/**
 * 恢复定时任务
 */
declare const resumeSchedule: typeof scheduleResume;
/**
 * 列出定时任务
 */
declare const listSchedule: typeof scheduleList;
//#endregion
export { clearInterval, clearTimeout, listSchedule, pauseSchedule, resumeSchedule, setCron, setInterval, setTimeout };