import { ResponseRoute } from "../../types/event/index.js";
import { AppDispatchResult, AppMatchResult, RegisteredRes, RegisteredRoute, RouteDefinitions, RouteGroupConditions, RouteImporter, RouteResConfig } from "./types.js";
import "../index.js";
//#region src/application/router/dsl.d.ts
type RouterOptions<P extends string = string, E extends string = string> = {
  regular?: RegExp;
  events?: readonly E[];
  platforms?: readonly P[];
};
type GroupOptions<P extends string = string, E extends string = string> = RouteGroupConditions<P, E>;
declare class RouteGroup<P extends string, E extends string> {
  private readonly app;
  private readonly middlewares;
  private readonly options;
  private readonly scopeId;
  constructor(app: Router<P, E>, middlewares: RouteImporter[], options: GroupOptions<P, E>, scopeId: string);
  group(options: GroupOptions<P, E>, ...middlewares: RouteImporter[]): RouteGroup<P, E>;
  use(config: RouteDefinitions<P, E>, ...importers: RouteImporter[]): RegisteredRoute<P, E>[] | RegisteredRoute<P, E>;
}
declare class Router<P extends string = string, E extends string = string> {
  private readonly defaults;
  private readonly globalImporters;
  private readonly topLevelEntries;
  private readonly scopes;
  private readonly routes;
  private defaultScopeId?;
  constructor(options?: RouterOptions<P, E>);
  static create<const P extends string, const E extends string>(options?: RouterOptions<P, E>): Router<P, E>;
  group(options: GroupOptions<P, E>, ...middlewares: RouteImporter[]): RouteGroup<P, E>;
  use(config: RouteDefinitions<P, E>, ...importers: RouteImporter[]): RegisteredRoute<P, E>[] | RegisteredRoute<P, E>;
  res(config: RouteResConfig<P, E>, ...importers: RouteImporter[]): RegisteredRes<P, E>[];
  register(config: RouteDefinitions<P, E>, importers: RouteImporter[], inheritedOptions: GroupOptions<P, E>, scopeId: string): RegisteredRoute<P, E>[] | RegisteredRoute<P, E>;
  private registerOne;
  inspect(): {
    eventName: string;
    routes: {
      path: string;
      description: string;
      importerCount: number;
    }[];
  }[];
  get values(): any[];
  get define(): {
    current: ResponseRoute[];
  };
  match(event: {
    name?: string;
    MessageText?: string;
    platform?: string;
  }, scopeId?: string): AppMatchResult;
  dispatch(event: Record<string, unknown>, depth?: number): Promise<AppDispatchResult>;
  dispatchInScope(event: Record<string, unknown>, scopeId: string | undefined, depth?: number): Promise<AppDispatchResult>;
  handleScopeEvent(scopeId: string, event: Record<string, unknown>, next: () => void | Promise<void>): Promise<void>;
  handleFallbackEvent(event: Record<string, unknown>, next: () => void | Promise<void>): Promise<void>;
  private replyValidationFailure;
  private buildTopLevelEntries;
  private buildResEntriesFor;
  private buildScopeEntriesFor;
  private buildFallbackEntry;
  private ensureDefaultScope;
  private createScope;
  private getApplicableScopeIds;
  private runImporters;
}
//#endregion
export { Router, RouterOptions };