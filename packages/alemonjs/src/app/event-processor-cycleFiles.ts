import { Next, Events, Current, EventKeys, StoreResponseItem, OnResponseValue } from '../types';
import { useState } from './hook-use-state';
import { showErrorModule } from '../core/utils';
import { EventMessageText } from '../core/variable';
import { ResponseMiddleware } from './store';

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
    } = await import(`file://${file.path}`);

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
        const reg = new RegExp(app.regular);

        if (!reg.test(valueEvent['MessageText'])) {
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

    // 调用局部中间件
    const responseMiddleware = new ResponseMiddleware();

    // 找到当前响应体下对应的所有中间件。
    const currentsAndMiddleware = responseMiddleware.find(file.appName, file.stateKey);

    const currents = [];

    for (const cm of [...currentsAndMiddleware, file]) {
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
