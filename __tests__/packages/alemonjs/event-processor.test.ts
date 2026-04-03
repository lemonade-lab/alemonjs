/**
 * 事件处理器核心逻辑测试
 * 覆盖：路由树（cycleRoute 懒执行+缓存）、文件树构建、文件树遍历
 */

// ─── Mock 依赖 ──────────────────────────────────────────────

// mock core/variable — 提供 EventMessageText
jest.mock('../../../packages/alemonjs/src/core/variable', () => ({
  EventMessageText: ['message.create', 'private.message.create']
}));

// mock core/utils — showErrorModule + getCachedRegExp
jest.mock('../../../packages/alemonjs/src/core/utils', () => ({
  showErrorModule: jest.fn(),
  getCachedRegExp: (pattern: string | RegExp) => {
    if (pattern instanceof RegExp) return pattern;
    return new RegExp(pattern);
  }
}));

// mock core — re-export showErrorModule
jest.mock('../../../packages/alemonjs/src/core', () => ({
  showErrorModule: jest.fn()
}));

// mock hook-event-context — withEventContext 透传执行
jest.mock('../../../packages/alemonjs/src/app/hook-event-context', () => ({
  withEventContext: (_event: any, _next: any, fn: () => any) => fn()
}));

// mock event-utils — useState 默认返回 true
jest.mock('../../../packages/alemonjs/src/app/event-utils', () => ({
  useState: () => [true]
}));

// ─── 导入被测模块 ────────────────────────────────────────────

import { createRouteProcessChildren } from '../../../packages/alemonjs/src/app/event-processor-cycleRoute';
import { createFileTreeStep, createNextStep } from '../../../packages/alemonjs/src/app/event-processor-cycleFiles';
import { showErrorModule } from '../../../packages/alemonjs/src/core';

// ─── 类型（避免依赖内部 types barrel） ──────────────────────

interface FileTreeNode {
  middleware?: any;
  files: any[];
  children: Map<string, FileTreeNode>;
}

// ─── 辅助函数 ─────────────────────────────────────────────────

/** 创建跟踪调用次数的 handler 工厂 */
function createTrackedHandler(name: string, selectValue: string = 'message.create') {
  const tracker = { calls: 0 };
  const handler = jest.fn(async () => {
    tracker.calls++;
    return {
      select: selectValue,
      current: [
        (_event: any, next: any) => {
          next();
          return true;
        }
      ]
    };
  });
  return { handler, tracker };
}

/** 创建纯函数 handler（isFunction 分支） */
function createFunctionHandler() {
  const tracker = { calls: 0 };
  const handler = jest.fn(async () => {
    tracker.calls++;
    return async function pureHandler() {};
  });
  return { handler, tracker };
}

/** 等待所有异步回调完成 */
function flushAsync(ms = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** 创建简单的 callHandler（直接执行 currents 链并调用 next） */
function createSimpleCallHandler() {
  const executed: any[][] = [];
  const callHandler = (currents: any[], nextEvent: (...cns: boolean[]) => void) => {
    executed.push([...currents]);
    nextEvent();
  };
  return { callHandler, executed };
}

// ═══════════════════════════════════════════════════════════════
// 路由树测试（event-processor-cycleRoute）— 懒执行 + 缓存
// ═══════════════════════════════════════════════════════════════

describe('createRouteProcessChildren', () => {
  const baseEvent = { MessageText: 'hello' } as any;
  const select = 'message.create' as any;

  // ─── 叶子匹配 ────────────────────────────────────

  describe('叶子匹配', () => {
    it('匹配单个叶子 → 只执行路径上的 handler', async () => {
      const fnA = createTrackedHandler('A');
      const fnB = createTrackedHandler('B');
      const fnC = createTrackedHandler('C');

      const routes: any[] = [
        {
          handler: fnA.handler,
          regular: /hello/,
          children: [
            { handler: fnB.handler, regular: /hello/ },
            { handler: fnC.handler, regular: /world/ } // 不匹配
          ]
        }
      ];

      const { callHandler, executed } = createSimpleCallHandler();
      const done = jest.fn();

      const processChildren = createRouteProcessChildren(baseEvent, select, done, callHandler);
      processChildren(routes, [], () => {
        done();
      });

      await flushAsync();

      expect(fnA.tracker.calls).toBe(1);
      expect(fnB.tracker.calls).toBe(1);
      expect(fnC.tracker.calls).toBe(0); // 不匹配 /world/
      expect(executed.length).toBe(1);
    });

    it('无匹配叶子 → 零 handler 执行（聊天噪声场景）', async () => {
      const fnA = createTrackedHandler('A');
      const fnB = createTrackedHandler('B');

      const routes: any[] = [
        {
          handler: fnA.handler,
          children: [{ handler: fnB.handler, regular: /world/ }]
        }
      ];

      const { callHandler } = createSimpleCallHandler();
      const done = jest.fn();

      const processChildren = createRouteProcessChildren(baseEvent, select, done, callHandler);
      processChildren(routes, [], () => {
        done();
      });

      await flushAsync();

      expect(fnA.tracker.calls).toBe(0);
      expect(fnB.tracker.calls).toBe(0);
    });
  });

  // ─── 父级缓存 ────────────────────────────────────

  describe('父级缓存', () => {
    it('多叶子匹配共享父级 → 父级 handler 只执行 1 次', async () => {
      const fnParent = createTrackedHandler('Parent');
      const fnLeaf1 = createTrackedHandler('Leaf1');
      const fnLeaf2 = createTrackedHandler('Leaf2');

      const routes: any[] = [
        {
          handler: fnParent.handler,
          children: [
            { handler: fnLeaf1.handler, regular: /hello/ },
            { handler: fnLeaf2.handler, regular: /hell/ }
          ]
        }
      ];

      const { callHandler, executed } = createSimpleCallHandler();
      const done = jest.fn();

      const processChildren = createRouteProcessChildren(baseEvent, select, done, callHandler);
      processChildren(routes, [], () => {
        done();
      });

      await flushAsync();

      // 关键断言
      expect(fnParent.tracker.calls).toBe(1);
      expect(fnLeaf1.tracker.calls).toBe(1);
      expect(fnLeaf2.tracker.calls).toBe(1);
      expect(executed.length).toBe(2); // 两条路径
    });

    it('深层嵌套多叶子 → 所有祖先只执行 1 次', async () => {
      const fnA = createTrackedHandler('A');
      const fnB = createTrackedHandler('B');
      const fnC = createTrackedHandler('C');
      const fnD = createTrackedHandler('D');

      // A → B → [C(✓), D(✓)]
      const routes: any[] = [
        {
          handler: fnA.handler,
          children: [
            {
              handler: fnB.handler,
              children: [
                { handler: fnC.handler, regular: /hello/ },
                { handler: fnD.handler, regular: /hell/ }
              ]
            }
          ]
        }
      ];

      const { callHandler } = createSimpleCallHandler();
      const done = jest.fn();

      const processChildren = createRouteProcessChildren(baseEvent, select, done, callHandler);
      processChildren(routes, [], () => {
        done();
      });

      await flushAsync();

      expect(fnA.tracker.calls).toBe(1);
      expect(fnB.tracker.calls).toBe(1);
      expect(fnC.tracker.calls).toBe(1);
      expect(fnD.tracker.calls).toBe(1);
    });
  });

  // ─── 过滤逻辑 ────────────────────────────────────

  describe('过滤逻辑', () => {
    it('selects 不匹配 → 跳过节点', async () => {
      const fnA = createTrackedHandler('A');

      const routes: any[] = [
        {
          handler: fnA.handler,
          selects: 'private.message.create'
        }
      ];

      const { callHandler } = createSimpleCallHandler();
      const done = jest.fn();

      const processChildren = createRouteProcessChildren(baseEvent, select, done, callHandler);
      processChildren(routes, [], () => {
        done();
      });

      await flushAsync();

      expect(fnA.tracker.calls).toBe(0);
    });

    it('exact 精确匹配', async () => {
      const fnA = createTrackedHandler('A');
      const routes: any[] = [{ handler: fnA.handler, exact: 'hello' }];

      const { callHandler, executed } = createSimpleCallHandler();
      const done = jest.fn();
      const processChildren = createRouteProcessChildren(baseEvent, select, done, callHandler);
      processChildren(routes, [], () => {
        done();
      });
      await flushAsync();

      expect(fnA.tracker.calls).toBe(1);
      expect(executed.length).toBe(1);
    });

    it('exact 不匹配 → 跳过', async () => {
      const fnA = createTrackedHandler('A');
      const routes: any[] = [{ handler: fnA.handler, exact: 'world' }];

      const { callHandler } = createSimpleCallHandler();
      const done = jest.fn();
      const processChildren = createRouteProcessChildren(baseEvent, select, done, callHandler);
      processChildren(routes, [], () => {
        done();
      });
      await flushAsync();

      expect(fnA.tracker.calls).toBe(0);
    });

    it('prefix 前缀匹配', async () => {
      const fnA = createTrackedHandler('A');
      const routes: any[] = [{ handler: fnA.handler, prefix: 'hel' }];

      const { callHandler, executed } = createSimpleCallHandler();
      const done = jest.fn();
      const processChildren = createRouteProcessChildren(baseEvent, select, done, callHandler);
      processChildren(routes, [], () => {
        done();
      });
      await flushAsync();

      expect(fnA.tracker.calls).toBe(1);
      expect(executed.length).toBe(1);
    });

    it('prefix 不匹配 → 跳过', async () => {
      const fnA = createTrackedHandler('A');
      const routes: any[] = [{ handler: fnA.handler, prefix: 'xyz' }];

      const { callHandler } = createSimpleCallHandler();
      const done = jest.fn();
      const processChildren = createRouteProcessChildren(baseEvent, select, done, callHandler);
      processChildren(routes, [], () => {
        done();
      });
      await flushAsync();

      expect(fnA.tracker.calls).toBe(0);
    });

    it('regular 正则匹配', async () => {
      const fnA = createTrackedHandler('A');
      const routes: any[] = [{ handler: fnA.handler, regular: /^hel/ }];

      const { callHandler, executed } = createSimpleCallHandler();
      const done = jest.fn();
      const processChildren = createRouteProcessChildren(baseEvent, select, done, callHandler);
      processChildren(routes, [], () => {
        done();
      });
      await flushAsync();

      expect(fnA.tracker.calls).toBe(1);
      expect(executed.length).toBe(1);
    });

    it('handler 返回的 select 不匹配 → 路径无效', async () => {
      const fnParent = createTrackedHandler('Parent', 'guild.create');
      const fnLeaf = createTrackedHandler('Leaf');

      const routes: any[] = [
        {
          handler: fnParent.handler,
          children: [{ handler: fnLeaf.handler, regular: /hello/ }]
        }
      ];

      const { callHandler, executed } = createSimpleCallHandler();
      const done = jest.fn();
      const processChildren = createRouteProcessChildren(baseEvent, select, done, callHandler);
      processChildren(routes, [], () => {
        done();
      });
      await flushAsync();

      // fnParent 执行了（懒执行在到达叶子时）
      expect(fnParent.tracker.calls).toBe(1);
      // 但 select 不匹配 → callHandler 不应调用
      expect(executed.length).toBe(0);
    });
  });

  // ─── 边界场景 ────────────────────────────────────

  describe('边界场景', () => {
    it('空路由数组 → 直接调用 next', async () => {
      const { callHandler } = createSimpleCallHandler();
      const done = jest.fn();
      const processChildren = createRouteProcessChildren(baseEvent, select, done, callHandler);
      processChildren([], [], () => {
        done();
      });
      await flushAsync();

      expect(done).toHaveBeenCalled();
    });

    it('节点无 handler → 跳过', async () => {
      const routes: any[] = [{ handler: undefined as any, regular: /hello/ }];
      const { callHandler } = createSimpleCallHandler();
      const done = jest.fn();
      const processChildren = createRouteProcessChildren(baseEvent, select, done, callHandler);
      processChildren(routes, [], () => {
        done();
      });
      await flushAsync();

      expect(done).toHaveBeenCalled();
    });

    it('纯函数 handler → 加入 currents', async () => {
      const fnFunc = createFunctionHandler();
      const routes: any[] = [{ handler: fnFunc.handler, regular: /hello/ }];

      const { callHandler, executed } = createSimpleCallHandler();
      const done = jest.fn();
      const processChildren = createRouteProcessChildren(baseEvent, select, done, callHandler);
      processChildren(routes, [], () => {
        done();
      });
      await flushAsync();

      expect(fnFunc.tracker.calls).toBe(1);
      expect(executed.length).toBe(1);
      expect(typeof executed[0][0]).toBe('function');
    });

    it('callHandler 的 cn=true → 冒泡到 nextCycle', async () => {
      const fnA = createTrackedHandler('A');
      const routes: any[] = [{ handler: fnA.handler, regular: /hello/ }];

      // callHandler 模拟触发 cn=true
      const callHandler = (currents: any[], nextEvent: (...cns: boolean[]) => void) => {
        nextEvent(true);
      };
      const nextCycle = jest.fn();
      const processChildren = createRouteProcessChildren(baseEvent, select, nextCycle, callHandler);
      processChildren(routes, [], () => {});
      await flushAsync();

      expect(nextCycle).toHaveBeenCalledWith(true);
    });

    it('多个顶级节点依次处理', async () => {
      const fnA = createTrackedHandler('A');
      const fnB = createTrackedHandler('B');

      const routes: any[] = [
        { handler: fnA.handler, regular: /hello/ },
        { handler: fnB.handler, regular: /hello/ }
      ];

      const { callHandler, executed } = createSimpleCallHandler();
      const done = jest.fn();
      const processChildren = createRouteProcessChildren(baseEvent, select, done, callHandler);
      processChildren(routes, [], () => {
        done();
      });
      await flushAsync();

      expect(fnA.tracker.calls).toBe(1);
      expect(fnB.tracker.calls).toBe(1);
      expect(executed.length).toBe(2);
    });

    it('叶子 handler 抛错后应继续处理后续节点', async () => {
      const boom = jest.fn(async () => {
        throw new Error('boom');
      });
      const fnB = createTrackedHandler('B');

      const routes: any[] = [
        { handler: boom, regular: /hello/ },
        { handler: fnB.handler, regular: /hello/ }
      ];

      const { callHandler, executed } = createSimpleCallHandler();
      const done = jest.fn();
      const processChildren = createRouteProcessChildren(baseEvent, select, done, callHandler);
      processChildren(routes, [], () => {
        done();
      });

      await flushAsync();

      expect(boom).toHaveBeenCalledTimes(1);
      expect(fnB.tracker.calls).toBe(1);
      expect(executed.length).toBe(1);
      expect(done).toHaveBeenCalled();
      expect(showErrorModule).toHaveBeenCalled();
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// FileTree 构建逻辑测试（纯函数，复制自 store.ts 内部实现）
// ═══════════════════════════════════════════════════════════════

describe('FileTree 构建', () => {
  function createTreeNode(): FileTreeNode {
    return { files: [], children: new Map() };
  }

  function buildFileTree(files: any[], mwResponse?: { [key: string]: any }): FileTreeNode {
    const root = createTreeNode();
    for (const file of files) {
      if (!file.stateKey) {
        root.files.push(file);
        continue;
      }
      const parts = file.stateKey.split(':');
      let node = root;
      for (const part of parts) {
        if (!node.children.has(part)) {
          node.children.set(part, createTreeNode());
        }
        node = node.children.get(part)!;
      }
      node.files.push(file);
    }
    if (mwResponse) {
      for (const [key, mw] of Object.entries(mwResponse)) {
        const parts = key.split(':');
        let node = root;
        for (const part of parts) {
          if (!node.children.has(part)) {
            node.children.set(part, createTreeNode());
          }
          node = node.children.get(part)!;
        }
        node.middleware = mw;
      }
    }
    return root;
  }

  function mergeFileTree(target: FileTreeNode, source: FileTreeNode) {
    target.files.push(...source.files);
    if (source.middleware && !target.middleware) {
      target.middleware = source.middleware;
    }
    for (const [key, child] of source.children) {
      if (target.children.has(key)) {
        mergeFileTree(target.children.get(key)!, child);
      } else {
        target.children.set(key, child);
      }
    }
  }

  it('无 stateKey 的文件放在根节点', () => {
    const tree = buildFileTree([{ path: '/a.ts', name: 'a.ts' }]);
    expect(tree.files.length).toBe(1);
    expect(tree.files[0].path).toBe('/a.ts');
    expect(tree.children.size).toBe(0);
  });

  it('按 stateKey 分层组织', () => {
    const tree = buildFileTree([
      { path: '/a.ts', stateKey: 'main:response:admin', name: 'a.ts' },
      { path: '/b.ts', stateKey: 'main:response:admin', name: 'b.ts' },
      { path: '/c.ts', stateKey: 'main:response:public', name: 'c.ts' }
    ]);
    expect(tree.files.length).toBe(0);
    const adminNode = tree.children.get('main')!.children.get('response')!.children.get('admin')!;
    expect(adminNode.files.length).toBe(2);
    const publicNode = tree.children.get('main')!.children.get('response')!.children.get('public')!;
    expect(publicNode.files.length).toBe(1);
  });

  it('中间件挂到对应层级', () => {
    const mw = { path: '/mw.ts', stateKey: 'main:response:admin', name: 'mw.ts' };
    const tree = buildFileTree([{ path: '/a.ts', stateKey: 'main:response:admin', name: 'a.ts' }], { 'main:response:admin': mw });
    const adminNode = tree.children.get('main')!.children.get('response')!.children.get('admin')!;
    expect(adminNode.middleware).toBe(mw);
    expect(adminNode.files.length).toBe(1);
  });

  it('合并两棵树', () => {
    const t1 = buildFileTree([{ path: '/a.ts', stateKey: 'main:response', name: 'a' }]);
    const t2 = buildFileTree([{ path: '/b.ts', stateKey: 'main:response', name: 'b' }]);
    mergeFileTree(t1, t2);
    const node = t1.children.get('main')!.children.get('response')!;
    expect(node.files.length).toBe(2);
  });

  it('合并保留已有中间件', () => {
    const mw1 = { path: '/mw1.ts', name: 'mw1' };
    const mw2 = { path: '/mw2.ts', name: 'mw2' };
    const t1 = buildFileTree([], { main: mw1 as any });
    const t2 = buildFileTree([], { main: mw2 as any });
    mergeFileTree(t1, t2);
    expect(t1.children.get('main')!.middleware).toBe(mw1);
  });

  it('空数组构建空树', () => {
    const tree = buildFileTree([]);
    expect(tree.files.length).toBe(0);
    expect(tree.children.size).toBe(0);
    expect(tree.middleware).toBeUndefined();
  });

  it('单层 stateKey（无冒号）', () => {
    const tree = buildFileTree([{ path: '/a.ts', stateKey: 'root', name: 'a' }]);
    expect(tree.children.has('root')).toBe(true);
    expect(tree.children.get('root')!.files.length).toBe(1);
  });

  it('合并不同子树分支', () => {
    const t1 = buildFileTree([{ path: '/a.ts', stateKey: 'x:y', name: 'a' }]);
    const t2 = buildFileTree([{ path: '/b.ts', stateKey: 'x:z', name: 'b' }]);
    mergeFileTree(t1, t2);
    const xNode = t1.children.get('x')!;
    expect(xNode.children.has('y')).toBe(true);
    expect(xNode.children.has('z')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// 文件树遍历测试（createFileTreeStep）
// ═══════════════════════════════════════════════════════════════

describe('createFileTreeStep', () => {
  const select = 'message.create' as any;

  it('空树 → 直接调用 next', async () => {
    const root: FileTreeNode = { files: [], children: new Map() };
    const { callHandler } = createSimpleCallHandler();
    const done = jest.fn();
    const startStep = createFileTreeStep({} as any, select, done, root, callHandler);
    startStep();
    await flushAsync();
    expect(done).toHaveBeenCalled();
  });

  it('只有空子节点的树 → 递归完成', async () => {
    const root: FileTreeNode = {
      files: [],
      children: new Map([['child', { files: [], children: new Map() }]])
    };
    const { callHandler } = createSimpleCallHandler();
    const done = jest.fn();
    const startStep = createFileTreeStep({} as any, select, done, root, callHandler);
    startStep();
    await flushAsync();
    expect(done).toHaveBeenCalled();
  });

  it('next(true) 冒泡到上层', async () => {
    const root: FileTreeNode = { files: [], children: new Map() };
    const done = jest.fn();
    const { callHandler } = createSimpleCallHandler();
    const startStep = createFileTreeStep({} as any, select, done, root, callHandler);
    startStep(true);
    await flushAsync();
    expect(done).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════
// createNextStep 扁平版（middleware 路径）
// ═══════════════════════════════════════════════════════════════

describe('createNextStep（扁平版）', () => {
  const select = 'message.create' as any;

  it('空文件列表 → 直接调用 next', async () => {
    const { callHandler } = createSimpleCallHandler();
    const done = jest.fn();
    const nextStep = createNextStep({} as any, select, done, [], callHandler);
    nextStep();
    await flushAsync();
    expect(done).toHaveBeenCalled();
  });

  it('next(true) 冒泡', async () => {
    const { callHandler } = createSimpleCallHandler();
    const outerNext = jest.fn();
    const nextStep = createNextStep({} as any, select, outerNext, [], callHandler);
    nextStep(true);
    await flushAsync();
    expect(outerNext).toHaveBeenCalled();
  });
});
