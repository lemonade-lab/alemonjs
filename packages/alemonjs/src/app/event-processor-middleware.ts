/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { Next, Events, OnMiddlewareValue, Current, EventKeys } from '../types';
import { useState } from './hook-use-state';
import { showErrorModule } from '../core/utils';
import { Middleware } from './store';
import { EventMessageText } from '../core/variable';
import { createMiddlewareCallHandler } from './event-processor-middleware-callHandler';

/**
 * 处理中间件
 * @param event
 * @param select
 */
export const expendMiddleware = <T extends EventKeys>(valueEvent: Events[T], select: T, next: Next) => {
  // const mdR = new MiddlewareR();

  // const r = mdR.value;

  // let index = 0;

  // const nextMiddlewareR = (cn?: boolean, ...cns: boolean[]) => {
  //   if (cn) {
  //     next(...cns);

  //     return;
  //   }

  //   if (index >= r.length) {
  //     next();

  //     return;
  //   }

  //   const route = r[index];
  //   index++;
  // };

  const mw = new Middleware();
  // 得到所有 mws
  const mwFiles = mw.value;

  let valueI = 0;
  // let valueJ = 0

  const callHandler = createMiddlewareCallHandler(valueEvent);

  /**
   * 下一步
   * @returns
   */
  const nextMiddleware: Next = (cn, ...cns) => {
    if (cn) {
      next(...cns);

      return;
    }
    // 结束了
    if (valueI >= mwFiles.length) {
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
    if (valueI >= mwFiles.length) {
      // 开始调用j
      nextMiddleware();

      return;
    }
    valueI++;
    const file = mwFiles[valueI - 1];

    if (!file?.path) {
      // 继续
      nextMiddleware();

      return;
    }

    try {
      const app: {
        default: OnMiddlewareValue<Current<EventKeys>, T>;
        regular?: string | RegExp;
        // name?: string
        // state?: [boolean, (value: boolean) => void]
      } = await import(`file://${file.path}`);

      if (!app?.default?.current || !app?.default?.select) {
        // 继续
        nextMiddleware();

        return;
      }

      // 检查状态
      if (file?.stateKey) {
        const [state] = useState(file?.stateKey);

        if (state === false) {
          // 继续
          nextMiddleware();

          return;
        }
      }

      if (EventMessageText.includes(select)) {
        if (app?.regular) {
          const reg = new RegExp(app.regular);

          if (!reg.test(valueEvent['MessageText'])) {
            // 继续
            nextMiddleware();

            return;
          }
        }
      }

      const selects = Array.isArray(app.default.select) ? app.default.select : [app.default.select];

      if (!selects.includes(select)) {
        // 继续
        nextMiddleware();

        return;
      }

      const currents = Array.isArray(app.default.current) ? app.default.current : [app.default.current];

      callHandler(currents, nextMiddleware);
    } catch (err) {
      showErrorModule(err);
    }
  };

  // 开始修正模式
  nextMiddleware();
};
