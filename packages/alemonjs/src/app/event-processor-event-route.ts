/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { isAsyncFunction } from 'util/types';
import { Next, Events, EventKeys, ResponseRoute } from '../types';
import { ResponseRouter } from './store';
import { EventMessageText } from '../core/variable';
import { showErrorModule } from '../core';
import { createCallHandler } from './event-processor-event-callHandler';

export const expendEventRoute = <T extends EventKeys>(valueEvent: Events[T], select: T, nextCycle: Next) => {
  const resRoute = new ResponseRouter();

  const routes = resRoute.value;

  // 开始处理 heandler
  const callHandler = createCallHandler(valueEvent);

  // 开始处理 handler
  const processChildren = (nodes: ResponseRoute[], middleware, next) => {
    if (!nodes || nodes.length === 0) {
      next();

      return;
    }

    let idx = 0;

    const nextNode = async () => {
      idx++;
      if (idx > nodes.length) {
        next();

        return;
      }
      const node = nodes[idx - 1];

      if (node?.selects) {
        const selects = Array.isArray(node.selects) ? node.selects : [node.selects];

        if (!selects.includes(select)) {
          void nextNode();

          return;
        }
      }

      // 正则匹配
      if (EventMessageText.includes(select) && node.regular) {
        const reg = new RegExp(node.regular);

        if (!reg.test(valueEvent['MessageText'])) {
          void nextNode();

          return;
        }
      }
      if (!node.handler) {
        void nextNode();

        return;
      }
      // 递归：如果有children，继续递归下去
      if (node.children && node.children.length > 0) {
        // middleware 追加自身 handler

        processChildren(node.children, [...middleware, node.handler], nextNode);

        return;
      }

      // 没有children，直接处理handler
      const currentsAndMiddleware = [...middleware, node.handler];

      // node.handler 是一个异步函数。函数执行的结果是 { current: Current[] | Current, select: xxx }

      try {
        const currents = [];

        for (const item of currentsAndMiddleware) {
          const app = isAsyncFunction(item) ? await item() : item();
          // 没有 default。因为是 import x from './';

          // 中间件也有 selects。
          // 如果 发现 和当前要处理的 selects 不匹配。
          // 只要是一个不匹配。则说明处理还不是最终想要执行结果。

          const selects = Array.isArray(app.select) ? app.select : [app.select];

          // 没有匹配到
          if (!selects.includes(select)) {
            // 需要继续。
            void nextNode();

            return;
          }

          // 可能是数组。也可能不是数组
          const currentsItem = Array.isArray(app.current) ? app.current : [app.current];

          currents.push(...currentsItem);
        }

        // 要把二维数组拍平
        callHandler(currents, (cn, ...cns) => {
          if (cn) {
            // 这里的 next 要加 true。
            // 因为下一层是旧版本逻辑。不加一层。会出现处理了没有完全结束周期
            nextCycle(true, ...cns);

            return;
          }
          void nextNode();
        });
      } catch (err) {
        showErrorModule(err);
      }
    };

    void nextNode();
  };

  void processChildren(routes, [], nextCycle);
};
