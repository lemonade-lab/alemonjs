import { scheduleCancel, scheduleCron, scheduleInterval, scheduleList, schedulePause, scheduleResume, scheduleTimeout } from "./runtime/schedule-store.js";

//#region src/application/schedule.ts
/**
* 替代原生 setInterval，由框架统一管理。
* 框架内部通过调用栈自动识别所属插件，卸载时自动清理。
*/
const setInterval = (callback, ms) => scheduleInterval(callback, ms);
/**
* 替代原生 setTimeout，由框架统一管理。
* 框架内部通过调用栈自动识别所属插件，执行后自动清理。
*/
const setTimeout = (callback, ms) => scheduleTimeout(callback, ms);
/**
* 注册 cron 表达式定时任务，由框架统一管理。
* 框架内部通过调用栈自动识别所属插件，卸载时自动清理。
*/
const setCron = (expression, callback) => scheduleCron(expression, callback);
/**
* 替代原生 clearInterval，取消框架管理的间隔定时任务
*/
const clearInterval = scheduleCancel;
/**
* 替代原生 clearTimeout，取消框架管理的延迟任务
*/
const clearTimeout = scheduleCancel;
/**
* 暂停定时任务
*/
const pauseSchedule = schedulePause;
/**
* 恢复定时任务
*/
const resumeSchedule = scheduleResume;
/**
* 列出定时任务
*/
const listSchedule = scheduleList;

//#endregion
export { clearInterval, clearTimeout, listSchedule, pauseSchedule, resumeSchedule, setCron, setInterval, setTimeout };