import type { RouteSchema, RouteSchemaValue, RouteValidationResult } from './validator';

export type RouteParams = Record<string, RouteSchemaValue | undefined>;
export type RouteContext = {
  key: string;
  text: string;
  sourceText?: string;
  rewrittenText?: string;
  rawArgs: string[];
  parsedArgs: RouteSchemaValue[];
  params: RouteParams;
};
export type RouteTextRule = {
  prefixes?: readonly string[];
  stripPrefix?: boolean;
  allowBare?: boolean;
};
export type RouteTextConfig<P extends string = string> = RouteTextRule & {
  byPlatform?: Partial<Record<P, RouteTextRule>>;
};

export type RouteImporter = () => Promise<unknown>;
export type RouteNext = () => Promise<void> | undefined;
export type RouteExecutable = (event: Record<string, unknown>, next: RouteNext) => Promise<boolean | undefined> | boolean | undefined;

export type RouteHandlerConfig<P extends string = string, E extends string = string> = {
  path?: string;
  description?: string;
  events?: readonly E[];
  platforms?: readonly P[];
  schema?: RouteSchema;
};

export type RouteGroupConditions<P extends string = string, E extends string = string> = {
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

export type RouteResConfig<P extends string = string, E extends string = string> = {
  events?: readonly E[];
  platforms?: readonly P[];
  regular?: RegExp;
};

export type RouteDefinition<P extends string = string, E extends string = string> = string | RouteHandlerConfig<P, E>;
export type RouteDefinitions<P extends string = string, E extends string = string> = RouteDefinition<P, E> | RouteDefinition<P, E>[];

export type NormalizedRouteConfig<P extends string = string, E extends string = string> = {
  path?: string;
  description?: string;
  events?: readonly E[];
  platforms?: readonly P[];
  schema?: RouteSchema;
};

export type RegisteredRoute<P extends string = string, E extends string = string> = {
  config: NormalizedRouteConfig<P, E> & {
    path: string;
  };
  scopeId: string;
  keyLength: 1 | 2;
  importers: RouteImporter[];
  inheritedImporters: RouteImporter[];
};

export type RegisteredRes<P extends string = string, E extends string = string> = {
  config: RouteResConfig<P, E>;
  importers: RouteImporter[];
};

export type AppMatchResult =
  | {
      matched: false;
    }
  | {
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

export type DispatchStopReason =
  | 'unmatched'
  | 'validation_failed'
  | 'handler_returned_false'
  | 'handler_completed'
  | 'redispatch_limit'
  | 'unsupported_handler';

export type AppDispatchResult = {
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
