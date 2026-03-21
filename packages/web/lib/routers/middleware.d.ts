export declare function collectMiddlewares(routeFile: string): Promise<Array<(ctx: any, next: () => Promise<void>) => Promise<void>>>;
export declare function runMiddlewares(middlewares: Array<(ctx: any, next: () => Promise<void>) => Promise<void>>, ctx: any, handler: (ctx: any) => Promise<void>): Promise<void>;
