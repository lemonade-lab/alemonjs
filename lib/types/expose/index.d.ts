//#region src/types/expose/index.d.ts
/** action 描述 */
interface ExposeActionMeta {
  description: string;
  params?: Record<string, string>;
  returns?: Record<string, string>;
  handler: (...args: any[]) => any;
}
/** provide 的单对象参数 */
interface ExposeProvideConfig {
  name: string;
  description: string;
  actions: Record<string, ExposeActionMeta>;
}
/** list() 返回的 item */
interface ExposeListItem {
  name: string;
  protocol: string;
  description: string;
  actions: Record<string, {
    description: string;
    params?: Record<string, string>;
    returns?: Record<string, string>;
  }>;
  invoke: (action: string, value?: any) => any;
}
/** watch 回调的 event */
interface ExposeWatchEvent {
  name: string;
  protocol: string;
  action: string;
  value?: any;
}
/** schema() 返回的结构 */
interface ExposeSchemaItem {
  protocol: string;
  description: string;
  providers: {
    name: string;
  }[];
  actions: Record<string, {
    description: string;
    params?: Record<string, string>;
    returns?: Record<string, string>;
  }>;
  invoke: string;
}
//#endregion
export { ExposeActionMeta, ExposeListItem, ExposeProvideConfig, ExposeSchemaItem, ExposeWatchEvent };