//#region src/application/runtime/http/routers/middleware.d.ts
declare function collectMiddlewares(routeFile: string): Promise<Array<(ctx: any, next: () => Promise<void>) => Promise<void>>>;
declare function runMiddlewares(middlewares: Array<(ctx: any, next: () => Promise<void>) => Promise<void>>, ctx: any, handler: (ctx: any) => Promise<void>): Promise<void>;
//#endregion
export { collectMiddlewares, runMiddlewares };