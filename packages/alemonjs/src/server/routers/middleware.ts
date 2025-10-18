import { existsSync } from 'fs';
import path, { dirname } from 'path';

/**
 * 递归向上查找所有目录级 _middleware 文件
 * 支持 .ts/.js/.cjs/.mjs/.tsx/.jsx
 * 按目录从上到下顺序合成
 */
export async function collectMiddlewares(routeFile: string): Promise<Array<(ctx: any, next: () => Promise<void>) => Promise<void>>> {
  const middlewares: Array<(ctx: any, next: () => Promise<void>) => Promise<void>> = [];
  let dir = dirname(routeFile);

  // 支持的后缀
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
/**
 * 依次执行中间件链，最后执行 handler
 * 如果有任意中间件或 handler 抛错，自动捕获并处理
 */
export async function runMiddlewares(
  middlewares: Array<(ctx: any, next: () => Promise<void>) => Promise<void>>,
  ctx: any,
  handler: (ctx: any) => Promise<void>
) {
  let idx = 0;

  async function dispatch() {
    if (idx < middlewares.length) {
      // 执行下一个中间件
      await middlewares[idx++](ctx, dispatch);
    } else {
      // 执行最终 handler
      await handler(ctx);
    }
  }

  await dispatch();
}
