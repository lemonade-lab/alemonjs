import { Next, Events, EventKeys, ResponseRoute } from '../types';
import { EventMessageText } from '../core/variable';
import { showErrorModule } from '../core';
import { getCachedRegExp } from '../core/utils';

// 缓存 AsyncFunction 构造函数 — 避免每次调用创建匿名 async 函数
const AsyncFunction = (async () => {}).constructor;

function isAsyncFunction(fn) {
  return fn instanceof AsyncFunction;
}

function isFunction(value) {
  return isAsyncFunction(value) || typeof value === 'function' || value instanceof Function;
}

/**
 * 创建路由处理调用函数
 * @param valueEvent
 * @param select
 * @param nextCycle
 * @param callHandler
 * @returns
 */
export const createRouteProcessChildren = <T extends EventKeys>(
  valueEvent: Events[T],
  select: T,
  nextCycle: Next,
  callHandler: (currents: any, nextEvent: any) => void
) => {
  // handler 执行结果缓存 — 同一个 handler 在一次事件中只执行一次
  const handlerResultCache = new Map<() => any, { matched: boolean; currents: any[] }>();

  /**
   * 链表节点 — 替代 concat 数组，每层只创建 O(1) 节点
   */
  interface HandlerNode {
    handler: () => any;
    prev: HandlerNode | null;
  }

  /** 从链表尾部回溯收集所有 handler（返回按根→叶顺序） */
  const collectHandlers = (tail: HandlerNode): Array<() => any> => {
    const result: Array<() => any> = [];
    let node: HandlerNode | null = tail;

    while (node) {
      result.push(node.handler);
      node = node.prev;
    }
    result.reverse();

    return result;
  };

  /**
   * 执行 handler 并缓存结果，已缓存则直接返回
   */
  const resolveHandler = async (handler: () => any): Promise<{ matched: boolean; currents: any[] }> => {
    if (handlerResultCache.has(handler)) {
      return handlerResultCache.get(handler);
    }

    const app = await handler();
    const result: { matched: boolean; currents: any[] } = { matched: true, currents: [] };

    if (isFunction(app)) {
      result.currents.push(app);
    } else {
      const selects = Array.isArray(app.select) ? app.select : [app.select];

      if (!selects.includes(select)) {
        result.matched = false;
      } else {
        const items = Array.isArray(app.current) ? app.current : [app.current];

        result.currents.push(...items);
      }
    }

    handlerResultCache.set(handler, result);

    return result;
  };

  // 开始处理 handler
  const processChildren = (nodes: ResponseRoute[], pendingTail: HandlerNode | null, next: () => Promise<void> | void) => {
    if (!nodes || nodes.length === 0) {
      void next();

      return;
    }

    let idx = 0;

    const nextNode = async () => {
      idx++;
      if (idx > nodes.length) {
        void next();

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

      // 文本匹配（按性能从高到低：exact > prefix > regular）
      if (EventMessageText.includes(select)) {
        const text: string = valueEvent['MessageText'] ?? '';

        // 精确匹配（最快，O(1) 字符串比较）
        if (node.exact !== undefined) {
          if (text !== node.exact) {
            void nextNode();

            return;
          }
        }

        // 前缀匹配（快，O(n) startsWith）
        if (node.prefix !== undefined) {
          if (!text.startsWith(node.prefix)) {
            void nextNode();

            return;
          }
        }

        // 正则匹配（使用缓存，避免每条消息重编译）
        if (node.regular) {
          if (!getCachedRegExp(node.regular).test(text)) {
            void nextNode();

            return;
          }
        }
      }

      if (!node.handler) {
        void nextNode();

        return;
      }

      // 当前节点的链表节点 — O(1), 无数组拷贝
      const currentNode: HandlerNode = { handler: node.handler, prev: pendingTail };

      // 有 children → 不执行 handler，只挂链表，递归下去
      if (node.children && node.children.length > 0) {
        processChildren(node.children, currentNode, () => {
          void nextNode();
        });

        return;
      }

      // 叶子节点 → 从链表收集全部 handler 并执行
      try {
        const allHandlers = collectHandlers(currentNode);
        const allCurrents: any[] = [];

        for (const h of allHandlers) {
          const result = await resolveHandler(h);

          if (!result.matched) {
            // handler 的 select 不匹配 → 整条路径无效
            void nextNode();

            return;
          }

          allCurrents.push(...result.currents);
        }

        callHandler(allCurrents, (cn, ...cns) => {
          if (cn) {
            nextCycle(true, ...cns);

            return;
          }
          void nextNode();
        });
      } catch (err) {
        showErrorModule(err);
        // 异常时跳过当前节点，继续后续节点，避免整条链卡住
        void nextNode();
      }
    };

    void nextNode();
  };

  return (nodes: ResponseRoute[], _pending: any[], next: () => Promise<void> | void) => {
    processChildren(nodes, null, next);
  };
};
