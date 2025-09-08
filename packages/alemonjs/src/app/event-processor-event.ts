/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { isAsyncFunction } from 'util/types';
import { Next, Events, OnResponseValue, Current, EventKeys, CurrentResultValue } from '../typings';
import { useState } from './hook-use-state';
import { showErrorModule } from '../core/utils';
import { Response } from './store';
import { useMessage } from './hook-use-api';
import { EventMessageText } from '../core/variable';

/**
 * 消息体处理机制
 * @param event
 * @param key
 */
export const expendEvent = async <T extends EventKeys>(valueEvent: Events[T], select: T, next: Function) => {
  const res = new Response();
  const [message] = useMessage(valueEvent);

  // 得到所有 res
  const StoreResponse = res.value;

  let valueI = 0;

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
    calli();
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

        if (state == false) {
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
      let index = 0;
      let isClose = false;
      let isNext = false;
      const onRes = (res: CurrentResultValue) => {
        if (!res) {
          isClose = true;

          return;
        }
        if (Array.isArray(res)) {
          if (res.length > 0) {
            // 发送数据
            message.send(res);
          }
          isClose = true;
        } else if (typeof res === 'object') {
          if (Array.isArray(res.data)) {
            // 发送数据
            message.send(res.data);
          }
          if (!res.allowGrouping) {
            isClose = true;
          }
        }
      };
      const start = async () => {
        if (index >= currents.length) {
          return;
        }
        if (isNext) {
          return;
        }
        if (isClose) {
          return;
        }
        if (isAsyncFunction(currents[index])) {
          const res = await currents[index](valueEvent, (...cns: boolean[]) => {
            isNext = true;
            nextEvent(...cns);
          });

          onRes(res);
        } else {
          const res = currents[index](valueEvent, (...cns: boolean[]) => {
            isNext = true;
            nextEvent(...cns);
          });

          onRes(res);
        }
        ++index;
        start();
      };

      start();
    } catch (err) {
      showErrorModule(err);
    }
  };

  nextEvent();
};
