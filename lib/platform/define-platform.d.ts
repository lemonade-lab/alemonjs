//#region src/platform/define-platform.d.ts
type Options = {
  /**
   * 注册入口
   * @returns
   */
  main: () => any;
  /**
   * 平台名称，用于日志标识
   */
  name?: string;
};
declare const definePlatform: (options: Options) => () => any;
//#endregion
export { definePlatform };