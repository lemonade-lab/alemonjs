//#region src/common/cbp/runtime.d.ts
declare const deviceId: `${string}-${string}-${string}-${string}-${string}`;
declare const generateUniqueId: () => string;
//#endregion
export { deviceId, generateUniqueId };