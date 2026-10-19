import { EventKeys } from "../types/event/map.js";
import "../types/index.js";
//#region src/common/variable.d.ts
declare const processorRepeatedEventTime: number;
declare const processorRepeatedUserTime: number;
declare const processorRepeatedClearTimeMin: number;
declare const processorRepeatedClearTimeMax: number;
declare const processorRepeatedClearSize = 37;
declare const processorMaxMapSize = 10000;
declare const fileSuffixMiddleware: RegExp;
declare const fileSuffixResponse: RegExp;
declare const filePrefixCommon: RegExp;
declare const defaultPort = 17117;
declare const defaultLogin = "gui";
declare const defaultPlatformPrefix = "alemonjs-";
declare const defaultPlatformCommonPrefix = "@alemonjs/";
declare const Ok = 2000;
declare const Warn = 2100;
declare const Fail = 4000;
declare const FailParams = 4001;
declare const FailAuth = 4002;
declare const FailInternal = 5000;
declare const EventMessageText: EventKeys[];
declare const ResultCode: {
  readonly Ok: 2000;
  readonly Fail: 4000;
  readonly FailParams: 4001;
  readonly Warn: 2100;
  readonly FailAuth: 4002;
  readonly FailInternal: 5000;
};
type ResultCode = (typeof ResultCode)[keyof typeof ResultCode];
declare class Result {
  #private;
  get value(): {
    code: ResultCode;
    message: string;
    data: null;
  }[];
  static create(): Result;
  push(param: {
    code: ResultCode;
    message: string;
    data: null;
  }): this;
  newIndex(): this;
  updateMessage(msg: string): this;
  updateData(data: any): this;
  updateCode(callback: (code: typeof ResultCode) => ResultCode): this;
}
//#endregion
export { EventMessageText, Fail, FailAuth, FailInternal, FailParams, Ok, Result, ResultCode, Warn, defaultLogin, defaultPlatformCommonPrefix, defaultPlatformPrefix, defaultPort, filePrefixCommon, fileSuffixMiddleware, fileSuffixResponse, processorMaxMapSize, processorRepeatedClearSize, processorRepeatedClearTimeMax, processorRepeatedClearTimeMin, processorRepeatedEventTime, processorRepeatedUserTime };