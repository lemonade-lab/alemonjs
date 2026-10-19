//#region src/application/runtime/http/routers/utils.d.ts
declare const safePath: (root: string, untrusted: string) => string | null;
declare const isValidPackageName: (name: string) => boolean;
declare const getModuelFile: (dir: string) => string;
declare const formatPath: (pathValue: string) => string;
//#endregion
export { formatPath, getModuelFile, isValidPackageName, safePath };