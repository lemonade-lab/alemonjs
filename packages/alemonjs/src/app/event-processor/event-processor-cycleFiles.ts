import { Next, Events, Current, EventKeys, StoreResponseItem, OnResponseValue } from '../../types';
import { useState } from '../hook-use/hook-use-state';
import { showErrorModule, getCachedRegExp } from '../../core/utils';
import { EventMessageText } from '../../core/variable';
import { ResponseMiddleware } from '../../store/store';

// 模块级单例 — ResponseMiddleware 无状态，无需每文件 new
const responseMiddlewareSingleton = new ResponseMiddleware();

// 模块缓存，避免每次事件处理都重新 import
const moduleCache = new Map<string, any>();

/**
 * 清除模块缓存（用于热更新等场景）
 */
export const clearModuleCache = (path?: string) => {
  if (path) {
    moduleCache.delete(path);
  } else {
    moduleCache.clear();
  }
};

const loadModule = async (filePath: string) => {
  if (moduleCache.has(filePath)) {
    return moduleCache.get(filePath);
  }
  const mod = await import(`file://${filePath}`);

  moduleCache.set(filePath, mod);

  return mod;
};

const callHandlerFile = async <T extends EventKeys>(
  valueEvent: Events[T],
  select: T,
  file: StoreResponseItem,
  nextStep: Next,
  callback: (app: { default: OnResponseValue<Current<EventKeys>, T>; regular?: string | RegExp }) => void
) => {
  try {
    const app: {
      default: OnResponseValue<Current<EventKeys>, T>;
      regular?: string | RegExp;
    } = await loadModule(file.path);

    // bad case
    if (!app?.default?.current || !app?.default?.select) {
      // 继续
      nextStep();

      return;
    }

    // 检查状态
    if (file?.stateKey) {
      const [state] = useState(file?.stateKey);

      if (state === false) {
        // 继续
        nextStep();

        return;
      }
    }

    if (EventMessageText.includes(select)) {
      if (app?.regular) {
        if (!getCachedRegExp(app.regular).test(valueEvent['MessageText'])) {
          // 继续
          nextStep();

          return;
        }
      }
    }

    const selects = Array.isArray(app.default.select) ? app.default.select : [app.default.select];

    if (!selects.includes(select)) {
      // 继续
      nextStep();

      return;
    }

    callback(app);
  } catch (err) {
    showErrorModule(err);
  }
};

/**
 * 创建 next 处理函数
 * @param event
 * @param select
 */
export const createNextStep = <T extends EventKeys>(
  valueEvent: Events[T],
  select: T,
  next: Next,
  files: StoreResponseItem[],
  callHandler: (currents: any, nextEvent: any) => void
) => {
  let valueI = 0;

  // 记录被close的中间件。优化下调用性能
  const recordCloseMw = new Set<string>();

  /**
   * 下一步
   * @returns
   */
  const nextStep: Next = (cn, ...cns) => {
    if (cn) {
      next(...cns);

      return;
    }
    // 结束了
    if (valueI >= files.length) {
      next();

      return;
    }
    // 检查所有
    void calli();
  };

  /**
   * 执行 i
   * @returns
   */
  const calli = async () => {
    // 调用完了
    if (valueI >= files.length) {
      // 开始调用j
      nextStep();

      return;
    }
    valueI++;
    const file = files[valueI - 1];

    if (!file?.path) {
      // 继续
      nextStep();

      return;
    }

    // 调用局部中间件（使用模块级单例，避免每文件创建新实例）
    const currentsAndMiddleware = responseMiddlewareSingleton.find(file.appName, file.stateKey);

    const currents = [];

    // 直接遍历 middleware 数组 + file，避免每文件 spread 创建新数组
    const iterItems = currentsAndMiddleware.length > 0 ? currentsAndMiddleware.concat(file) : [file];

    for (const cm of iterItems) {
      let isBreak = false;

      if (recordCloseMw.has(cm.stateKey)) {
        // 这是一个被关闭的中间件
        return;
      }

      /**
       * 直接关闭当前循环
       */
      const close = () => {
        isBreak = true;
        recordCloseMw.add(cm.stateKey);
      };

      await callHandlerFile(valueEvent, select, cm, close, app => {
        const currentsItem = Array.isArray(app.default.current) ? app.default.current : [app.default.current];

        currents.push(...currentsItem);
      });

      // 直接结束了
      if (isBreak) {
        // 进行下一步
        nextStep();

        return;
      }
    }

    // 调用当前响应体
    callHandler(currents, nextStep);
  };

  return nextStep;
};
