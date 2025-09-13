/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { Next, Events, OnResponseValue, Current, EventKeys } from '../types';
import { useState } from './hook-use-state';
import { showErrorModule } from '../core/utils';
import { Response } from './store';
import { EventMessageText } from '../core/variable';
import { expendEventRoute } from './event-processor-event-route';
import { createCallHandler } from './event-processor-event-callHandler';

/**
 * 消息体处理机制
 * @param event
 * @param key
 */
export const expendEvent = <T extends EventKeys>(valueEvent: Events[T], select: T, next: Next) => {
  const res = new Response();

  // 得到所有 response
  const StoreResponse = res.value;

  let valueI = 0;
  // 开始处理 heandler
  const callHandler = createCallHandler(valueEvent);

  /**
   * 下一步
   * @returns
   */
  const nextEvent: Next = (cn, ...cns) => {
    if (cn) {
      next(...cns);

      return;
    }
    // 结束了
    if (valueI >= StoreResponse.length) {
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
    if (valueI >= StoreResponse.length) {
      // 开始调用j
      nextEvent();

      return;
    }
    valueI++;
    const file = StoreResponse[valueI - 1];

    if (!file?.path) {
      // 继续
      nextEvent();

      return;
    }
    //
    try {
      const app: {
        default: OnResponseValue<Current<EventKeys>, T>;
        regular?: string | RegExp;
      } = await import(`file://${file.path}`);

      if (!app?.default?.current || !app?.default?.select) {
        // 继续
        nextEvent();

        return;
      }

      // 检查状态
      if (file?.stateKey) {
        const [state] = useState(file?.stateKey);

        if (state === false) {
          // 继续
          nextEvent();

          return;
        }
      }

      const selects = Array.isArray(app.default.select) ? app.default.select : [app.default.select];

      // 没有匹配到
      if (!selects.includes(select)) {
        // 继续
        nextEvent();

        return;
      }

      // 消息类型数据
      if (EventMessageText.includes(select)) {
        if (app?.regular) {
          const reg = new RegExp(app.regular);

          if (!reg.test(valueEvent['MessageText'])) {
            // 继续
            nextEvent();

            return;
          }
        }
      }

      const currents = Array.isArray(app.default.current) ? app.default.current : [app.default.current];

      callHandler(currents, nextEvent);
    } catch (err) {
      showErrorModule(err);
    }
  };

  // 路由优先。路由的搞完了。再处理其他
  expendEventRoute(valueEvent, select, nextEvent);
};
