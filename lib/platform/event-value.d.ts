//#region src/platform/event-value.d.ts
type BaseMap = {
  [key: string]: unknown;
};
/**
 * 创建原生 value 映射
 * @deprecated 试验性功能，请勿使用
 */
declare const createEventValue: <T extends keyof R, R extends BaseMap>(event: {
  value: R[T];
}) => R[T];
//#endregion
export { createEventValue };