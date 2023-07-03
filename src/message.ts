/** 插件控制 */
const APP = {};
/**
 * 得到应用
 * @param key 插件名
 * @returns
 */
export function getApp(key: any): object {
  return APP[key];
}
/**
 * 设置应用
 * @param key   插件名
 * @param value  应用合集
 */
export function setApp(key: any, value: any): void {
  APP[key] = value;
  return;
}
/**
 * 删除应用
 * @param key 插件名
 */
export function delApp(key: any): void {
  delete APP[key];
  return;
}
export function getAppKey() {
  const arr = [];
  for (let key in APP) {
    arr.push(key);
  }
  return arr;
}
/** 消息控制 */
const MSG = {};
/**
 * 得到消息
 * @param key 插件名
 * @returns
 */
export function getMessage(key: string) {
  return MSG[key];
}
/**
 * 设置消息
 * @param key 插件名
 * @param fnc 方法
 */
export function setMessage(key: string, fnc: Function) {
  MSG[key] = fnc;
  return;
}
/**
 * 删除消息
 * @param key 插件名
 */
export function delMessage(key: string) {
  delete MSG[key];
  return;
}
