//#region src/application/runtime/load-modules/loadChild.d.ts
/**
 * 加载子模块
 * @param mainPath
 * @param appName
 * @throws {Error} - 如果 mainPath 无效，抛出错误。
 */
declare const loadChildren: (mainPath: string, appName: string) => Promise<void>;
/**
 * 模块文件
 * @param app
 */
declare const loadChildrenFile: (appName: string) => Promise<void>;
//#endregion
export { loadChildren, loadChildrenFile };