import { RouteSchema, RouteSchemaValue, RouteValidationResult } from "./validator.js";
//#region src/application/router/types.d.ts
type RouteParams = Record<string, RouteSchemaValue | undefined>;
type RouteContext = {
  key: string;
  text: string;
  sourceText?: string;
  rewrittenText?: string;
  rawArgs: string[];
  parsedArgs: RouteSchemaValue[];
  params: RouteParams;
};
type RouteTextRule = {
  prefixes?: readonly string[];
  stripPrefix?: boolean;
  allowBare?: boolean;
};
type RouteTextConfig<P extends string = string> = RouteTextRule & {
  byPlatform?: Partial<Record<P, RouteTextRule>>;
};
type RouteImporter = () => Promise<unknown>;
type RouteNext = () => Promise<void> | undefined;
type RouteExecutable = (event: Record<string, unknown>, next: RouteNext) => Promise<boolean | undefined> | boolean | undefined;
type RouteHandlerConfig<P extends string = string, E extends string = string> = {
  path?: string;
  description?: string;
  events?: readonly E[];
  platforms?: readonly P[];
  schema?: RouteSchema;
};
type RouteGroupConditions<P extends string = string, E extends string = string> = {
  path?: string;
  events?: readonly E[];
  platforms?: readonly P[];
  routeText?: RouteTextConfig<P>;
  keyPolicy?: {
    maxWords?: 1 | 2;
  };
  duplicateKey?: 'ignore' | 'warn' | 'throw';
  fallback?: {
    suggest?: boolean;
    maxDistance?: number;
    minInputLength?: number;
    allowPrefixMatch?: boolean;
  };
  redispatch?: {
    maxDepth?: number;
  };
};
type RouteResConfig<P extends string = string, E extends string = string> = {
  events?: readonly E[];
  platforms?: readonly P[];
  regular?: RegExp;
};
type RouteDefinition<P extends string = string, E extends string = string> = string | RouteHandlerConfig<P, E>;
type RouteDefinitions<P extends string = string, E extends string = string> = RouteDefinition<P, E> | RouteDefinition<P, E>[];
type NormalizedRouteConfig<P extends string = string, E extends string = string> = {
  path?: string;
  description?: string;
  events?: readonly E[];
  platforms?: readonly P[];
  schema?: RouteSchema;
};
type RegisteredRoute<P extends string = string, E extends string = string> = {
  config: NormalizedRouteConfig<P, E> & {
    path: string;
  };
  scopeId: string;
  keyLength: 1 | 2;
  importers: RouteImporter[];
  inheritedImporters: RouteImporter[];
};
type RegisteredRes<P extends string = string, E extends string = string> = {
  config: RouteResConfig<P, E>;
  importers: RouteImporter[];
};
type AppMatchResult = {
  matched: false;
} | {
  matched: true;
  route: RegisteredRoute;
  eventName: string;
  normalizedCommand: string;
  rawArgs: string[];
  parsedArgs: RouteSchemaValue[];
  validation: RouteValidationResult;
  matchedPath: string;
  importerCount: number;
  importerLabels: string[];
};
type DispatchStopReason = 'unmatched' | 'validation_failed' | 'handler_returned_false' | 'handler_completed' | 'redispatch_limit' | 'unsupported_handler';
type AppDispatchResult = {
  matched: boolean;
  stopped: boolean;
  reason: DispatchStopReason;
  eventName: string;
  commandKey?: string;
  matchedPath?: string;
  normalizedCommand?: string;
  rawArgs: string[];
  parsedArgs: RouteSchemaValue[];
  params?: RouteParams;
  importerCount: number;
  importerLabels: string[];
  validation?: RouteValidationResult;
  rewrittenMessageText?: string;
};
//#endregion
export { AppDispatchResult, AppMatchResult, DispatchStopReason, NormalizedRouteConfig, RegisteredRes, RegisteredRoute, RouteContext, RouteDefinition, RouteDefinitions, RouteExecutable, RouteGroupConditions, RouteHandlerConfig, RouteImporter, RouteNext, RouteParams, RouteResConfig, RouteTextConfig, RouteTextRule };