import { DefineRouterFunc } from '../types';

/**
 * Lazy load a response handler
 * @param fnc
 * @returns
 */
export const lazy = <T extends { default: any }>(fnc: () => Promise<T>): (() => Promise<T['default']>) => {
  let c: T['default'] | null = null;

  // fnc 是一个 ()=> imoprt(); 函数。
  const back = async () => {
    if (c) {
      return c;
    }
    const mod = await fnc();

    if (!mod || !mod.default) {
      new Error('Lazy load failed: module has no default export');
    }

    c = mod.default;

    // 当back被调用时。
    return c;
  };

  return back;
};

/**
 * 手动执行一个动态导入的 handler
 * @param loader 动态导入函数 `() => import('./response/xxx')`
 * @param args handler 的参数数组 `[event, next]`
 */
export async function runHandler(loader: () => Promise<any>, args: any[]) {
  const mod = await loader();
  const handler = mod.default ?? mod;

  return handler(...args);
}

/**
 * 定义路由
 * 与 defineResponse 类似，但路由处理器是纯异步函数组件，
 * 内部自动根据 selects 来分类。
 * @param routes 路由配置数组
 * @returns
 */
export const defineRouter: DefineRouterFunc = routes => {
  return {
    current: routes
  };
};
