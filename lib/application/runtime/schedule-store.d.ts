import { CronExpression, ScheduleCallback, ScheduleId, ScheduleItem, ScheduleStatus } from "../../types/schedule/index.js";
//#region src/application/runtime/schedule-store.d.ts
/**
 * 注册应用目录，loadChild 加载时调用
 */
declare const registerAppDir: (appName: string, mainDir: string) => void;
/**
 * 注销应用目录，卸载时调用
 */
declare const unregisterAppDir: (appName: string) => void;
/**
 * 注册 interval 定时任务
 */
declare const scheduleInterval: (callback: ScheduleCallback, ms: number, appName?: string) => ScheduleId;
/**
 * 注册 timeout 定时任务 (一次性)
 */
declare const scheduleTimeout: (callback: ScheduleCallback, ms: number, appName?: string) => ScheduleId;
/**
 * 注册 cron 定时任务 (基于 cron 库的 CronJob)
 */
declare const scheduleCron: (expression: CronExpression, callback: ScheduleCallback, appName?: string) => ScheduleId;
/**
 * 暂停定时任务
 */
declare const schedulePause: (id: ScheduleId) => boolean;
/**
 * 恢复定时任务
 */
declare const scheduleResume: (id: ScheduleId) => boolean;
/**
 * 取消定时任务
 */
declare const scheduleCancel: (id: ScheduleId) => boolean;
/**
 * 按应用名取消所有定时任务
 */
declare const scheduleCancelByApp: (appName: string) => number;
/**
 * 取消所有定时任务
 */
declare const scheduleCancelAll: () => number;
/**
 * 获取所有定时任务列表
 */
declare const scheduleList: (appName?: string) => Array<{
  id: ScheduleId;
  type: ScheduleItem['type'];
  status: ScheduleStatus;
  ms?: number;
  cron?: string;
  appName?: string;
  createdAt: number;
}>;
//#endregion
export { registerAppDir, scheduleCancel, scheduleCancelAll, scheduleCancelByApp, scheduleCron, scheduleInterval, scheduleList, schedulePause, scheduleResume, scheduleTimeout, unregisterAppDir };