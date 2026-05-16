import { existsSync } from 'fs';
import path, { dirname } from 'path';

export async function collectMiddlewares(routeFile: string): Promise<Array<(ctx: any, next: () => Promise<void>) => Promise<void>>> {
  const middlewares: Array<(ctx: any, next: () => Promise<void>) => Promise<void>> = [];
  let dir = dirname(routeFile);
  const suffixes = ['.ts', '.js', '.cjs', '.mjs', '.tsx', '.jsx'];

  while (true) {
    for (const ext of suffixes) {
      const mwPath = path.join(dir, `_middleware${ext}`);

      if (existsSync(mwPath)) {
        const module = await import(`file://${mwPath}`);
        const mw = module?.default ?? {};

        if (typeof mw === 'function') {
          middlewares.unshift(mw);
        }
      }
    }
    const parent = dirname(dir);

    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  return middlewares;
}

export async function runMiddlewares(
  middlewares: Array<(ctx: any, next: () => Promise<void>) => Promise<void>>,
  ctx: any,
  handler: (ctx: any) => Promise<void>
) {
  let idx = 0;

  async function dispatch() {
    if (idx < middlewares.length) {
      await middlewares[idx++](ctx, dispatch);
    } else {
      await handler(ctx);
    }
  }

  await dispatch();
}
