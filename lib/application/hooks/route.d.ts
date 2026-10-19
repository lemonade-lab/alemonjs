import { EventKeys, Events } from "../../types/event/map.js";
import "../../types/index.js";
import { RouteSchemaValue } from "../router/validator.js";
import { RouteParams } from "../router/types.js";
//#region src/application/hooks/route.d.ts
type RouteReader = {
  param: (name: string) => RouteSchemaValue | undefined;
  hasParam: (name: string) => boolean;
};
type UseRouteUnmatched = RouteReader & {
  matched: false;
  key: undefined;
  text: undefined;
  sourceText: undefined;
  rewrittenText: undefined;
  rawArgs: [];
  parsedArgs: [];
  params: {
    [key: string]: any;
  };
};
type UseRouteMatched = RouteReader & {
  matched: true;
  key: string;
  text: string;
  sourceText?: string;
  rewrittenText: string;
  rawArgs: string[];
  parsedArgs: RouteSchemaValue[];
  params: RouteParams;
};
type UseRouteResult = UseRouteUnmatched | UseRouteMatched;
/**
 * 读取当前事件的路由上下文。
 * 该 hook 仅暴露只读快照，不直接暴露内部 __route 引用。
 */
declare const useRoute: <T extends EventKeys>(event?: Events[T]) => readonly [UseRouteResult];
//#endregion
export { UseRouteMatched, UseRouteResult, UseRouteUnmatched, useRoute };