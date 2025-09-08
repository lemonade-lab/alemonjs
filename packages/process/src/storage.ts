export const commands: {
  command: string;
  callback: Function;
}[] = [];
type LocalStorageType = {
  package: {
    name: string;
    version: string;
    description: string;
    main: string;
    exports: any;
  };
  desktop: any;
  action: any;
  view: any;
};
declare global {
  var processStorage: Map<string, LocalStorageType>;
}
// 存储扩展
const processStorage = new Map<string, LocalStorageType>();

if (!global.localStorage) {
  global.processStorage = processStorage;
}
export const storage = global.processStorage;
export const getPackages = () => Array.from(processStorage.values()).map(item => item.package);
