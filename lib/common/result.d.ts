import { ResultCode } from "./variable.js";
//#region src/common/result.d.ts
type Result<T = any> = {
  code: ResultCode;
  message: string | object;
  data: T;
};
declare const createResult: <T>(code: ResultCode, message: string | object, data?: T) => Result<T>;
//#endregion
export { Result, createResult };