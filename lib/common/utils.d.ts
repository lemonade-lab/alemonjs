import { Result, createResult } from "./result.js";
import { createUserHashKey, fastHash, isMaster, matchIn, useUserHashKey } from "./identity.js";
import { Dirent } from "fs";
//#region src/common/utils.d.ts
declare const createHash: (str: string, options?: {
  length?: number;
  algorithm?: string;
}) => string;
declare const getCachedRegExp: (pattern: string | RegExp) => RegExp;
declare const createEventName: (url: string, appKey: string) => string;
declare const stringToNumber: (str: string, size?: number) => number;
declare const getRecursiveDirFiles: (dir: string, condition?: (func: Dirent) => boolean) => {
  path: string;
  name: string;
}[];
declare const showErrorModule: (e: Error) => void;
declare const sanitizeForSerialization: (data: any) => any;
declare const getInputExportPath: (input?: string) => any;
//#endregion
export { type Result, createEventName, createHash, createResult, createUserHashKey, fastHash, getCachedRegExp, getInputExportPath, getRecursiveDirFiles, isMaster, matchIn, sanitizeForSerialization, showErrorModule, stringToNumber, useUserHashKey };