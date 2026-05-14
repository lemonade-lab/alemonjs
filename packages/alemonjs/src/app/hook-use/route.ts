import type { EventKeys, Events } from '../../types';
import type { RouteContext, RouteParams } from '../router/types';
import type { RouteSchemaValue } from '../router/validator';
import { getEventOrThrow } from './common';

type EventWithRoute = {
  __route?: RouteContext;
};

type RouteReader = {
  param: (name: string) => RouteSchemaValue | undefined;
  hasParam: (name: string) => boolean;
};

export type UseRouteUnmatched = RouteReader & {
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

export type UseRouteMatched = RouteReader & {
  matched: true;
  key: string;
  text: string;
  sourceText?: string;
  rewrittenText: string;
  rawArgs: string[];
  parsedArgs: RouteSchemaValue[];
  params: RouteParams;
};

export type UseRouteResult = UseRouteUnmatched | UseRouteMatched;

const createRouteReader = (params: RouteParams): RouteReader => ({
  param: (name: string) => params[name],
  hasParam: (name: string) => Object.prototype.hasOwnProperty.call(params, name) && params[name] !== undefined
});

const createEmptyRoute = (): UseRouteUnmatched => ({
  matched: false,
  key: undefined,
  text: undefined,
  sourceText: undefined,
  rewrittenText: undefined,
  rawArgs: [],
  parsedArgs: [],
  params: {},
  ...createRouteReader({})
});

/**
 * 读取当前事件的路由上下文。
 * 该 hook 仅暴露只读快照，不直接暴露内部 __route 引用。
 */
export const useRoute = <T extends EventKeys>(event?: Events[T]): readonly [UseRouteResult] => {
  const currentEvent = getEventOrThrow(event);
  const route = (currentEvent as Events[T] & EventWithRoute).__route;

  if (!route) {
    return [createEmptyRoute()] as const;
  }

  return [
    {
      matched: true,
      key: route.key,
      text: route.text,
      sourceText: route.sourceText,
      rewrittenText: route.rewrittenText ?? route.text,
      rawArgs: [...route.rawArgs],
      parsedArgs: [...route.parsedArgs],
      params: { ...route.params },
      ...createRouteReader(route.params)
    }
  ] as const;
};
