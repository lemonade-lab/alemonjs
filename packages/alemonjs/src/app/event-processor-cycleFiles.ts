import { Next, Events, Current, EventKeys, FileTreeNode, StoreResponseItem, OnResponseValue } from '../types';
import { showErrorModule, getCachedRegExp } from '../core/utils';
import { EventMessageText } from '../core/variable';

// 模块缓存，避免每次事件处理都重新 import
const moduleCache = new Map<string, any>();

/**
 * 同步 select 预过滤 — 模块已缓存时 O(1) 跳过不匹配文件
 * @returns true = 确定不匹配（可跳过）, false = 可能匹配或未缓存（需完整检查）
 */
const shouldSkipFile = <T extends EventKeys>(file: StoreResponseItem, select: T, valueEvent: Events[T]): boolean => {
  if (!moduleCache.has(file.path)) {
    return false;
  }

  const app = moduleCache.get(file.path);

  if (!app?.default?.current || !app?.default?.select) {
    return true;
  }

  // select 不匹配 → 跳过
  const selects = Array.isArray(app.default.select) ? app.default.select : [app.default.select];

  if (!selects.includes(select)) {
    return true;
  }

  // 文本事件正则不匹配 → 跳过
  if (EventMessageText.includes(select) && app?.regular) {
    if (!getCachedRegExp(app.regular).test(valueEvent['MessageText'])) {
      return true;
    }
  }

  return false;
};

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
    // 异常时也要推进链，避免整条子树静默丢失
    nextStep();
  }
};

/**
 * @deprecated 已被 createFileTreeStep + MiddlewareTree 替代
 * 创建 next 处理函数（扁平数组版）
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

    const currents = [];

    await callHandlerFile(
      valueEvent,
      select,
      file,
      () => {
        // 文件不匹配 → 跳过
        nextStep();
      },
      app => {
        const currentsItem = Array.isArray(app.default.current) ? app.default.current : [app.default.current];

        currents.push(...currentsItem);
      }
    );

    // 如果有 currents 说明匹配成功
    if (currents.length > 0) {
      callHandler(currents, nextStep);
    }
  };

  return nextStep;
};

// ─── 文件树版 ─────────────────────────────────────────────────

/**
 * 创建文件树版的 next 处理函数
 * 用树状 DFS 替代扁平遍历 + 运行时中间件查找，
 * 中间件在每个树层级只执行一次，不再重复
 */
export const createFileTreeStep = <T extends EventKeys>(
  valueEvent: Events[T],
  select: T,
  next: Next,
  root: FileTreeNode,
  callHandler: (currents: any, nextEvent: any) => void
) => {
  /**
   * 处理树节点（DFS）
   * @param node 当前节点
   * @param done 本节点处理完毕后的回调
   */
  const processNode = (node: FileTreeNode, done: Next) => {
    if (node.middleware?.path) {
      // 本层有中间件 → 加载并检查
      void checkMiddleware(node, done);
    } else {
      // 无中间件 → 直接处理内容
      void processContent(node, done);
    }
  };

  /**
   * 加载并检查本层中间件
   * 中间件 current 在该层级只执行一次（门控），通过后子节点不再重复执行
   */
  const checkMiddleware = async (node: FileTreeNode, done: Next) => {
    // select 预过滤 — 中间件已缓存且不匹配时同步跳过
    if (shouldSkipFile(node.middleware, select, valueEvent)) {
      void processContent(node, done);

      return;
    }

    let matched = false;
    const mwCurrents: any[] = [];

    await callHandlerFile(
      valueEvent,
      select,
      node.middleware,
      () => {
        // 中间件模块不匹配（select/regex/state 不对）→ 视为透明，继续处理子树
        void processContent(node, done);
      },
      app => {
        matched = true;
        const items = Array.isArray(app.default.current) ? app.default.current : [app.default.current];

        mwCurrents.push(...items);
      }
    );

    if (matched) {
      if (mwCurrents.length === 0) {
        // 中间件匹配但无 current → 直接通过
        void processContent(node, done);

        return;
      }

      // 中间件 current 只执行一次，作为门控
      // 哨兵函数：所有中间件 return true 后触发回调
      const gateCurrents = mwCurrents.concat([
        (_event: any, gateNext: any) => {
          gateNext();

          return true;
        }
      ]);

      callHandler(gateCurrents, (cn, ...cns) => {
        if (cn) {
          // 中间件内部调用了 next(true) → 冒泡到上层周期
          done(true, ...cns);

          return;
        }
        // 所有中间件 current 通过 → 继续处理子树
        void processContent(node, done);
      });
      // 如果中间件拦截（return void/false）→ 哨兵不执行 → 子树跳过
    }
    // 如果 !matched，callHandlerFile 的 nextStep 分支已调用 processContent
  };

  /**
   * 处理节点内容：先处理当前层文件，再递归子节点
   */
  const processContent = (node: FileTreeNode, done: Next) => {
    processFiles(
      node,
      0,
      () => {
        processChildNodes(node, done);
      },
      done
    );
  };

  /**
   * 依次处理本层的 handler 文件
   */
  const processFiles = (node: FileTreeNode, idx: number, filesDone: () => void, treeDone: Next) => {
    if (idx >= node.files.length) {
      filesDone();

      return;
    }
    const file = node.files[idx];

    if (!file?.path) {
      processFiles(node, idx + 1, filesDone, treeDone);

      return;
    }

    // select 预过滤 — 模块已缓存时 O(1) 同步跳过不匹配文件
    if (shouldSkipFile(file, select, valueEvent)) {
      processFiles(node, idx + 1, filesDone, treeDone);

      return;
    }

    void callHandlerFile(
      valueEvent,
      select,
      file,
      () => {
        // 文件不匹配 → 下一个文件
        processFiles(node, idx + 1, filesDone, treeDone);
      },
      app => {
        const fileCurrents = Array.isArray(app.default.current) ? app.default.current : [app.default.current];

        // 只有文件自身的 handler — 中间件已在树层级门控过
        callHandler(fileCurrents, (cn, ...cns) => {
          if (cn) {
            // handler 调用了 next(true) → 冒泡到上层周期
            treeDone(true, ...cns);
          } else {
            // handler 调用了 next() → 继续处理下一个文件
            processFiles(node, idx + 1, filesDone, treeDone);
          }
        });
      }
    );
  };

  /**
   * 依次递归处理子节点
   */
  const processChildNodes = (node: FileTreeNode, done: Next) => {
    const childKeys = Array.from(node.children.keys());
    let childIdx = 0;

    const nextChild = (...cns: boolean[]) => {
      // 如果子节点冒泡了 true → 继续冒泡
      if (cns.length > 0 && cns[0]) {
        done(...cns);

        return;
      }
      if (childIdx >= childKeys.length) {
        done();

        return;
      }
      const childNode = node.children.get(childKeys[childIdx++]);

      if (childNode) {
        processNode(childNode, nextChild);
      } else {
        nextChild();
      }
    };

    nextChild();
  };

  // 返回启动函数，供外部（路由系统）调用
  const startStep: Next = (cn, ...cns) => {
    if (cn) {
      next(...cns);

      return;
    }
    processNode(root, next);
  };

  return startStep;
};
