import { Expose, registerExpose, disposeExpose, clearAllExpose } from '../../../packages/alemonjs/src/app/expose';

const expose = Expose.create();

/**
 * 模拟框架侧注册流程：
 * 插件端: expose.provide({...}) → register() { return { expose } }
 * 框架端: registerExpose(appName, res.expose.getConfigs())
 */
function simulateRegister(appName: string, providerExpose: Expose) {
  registerExpose(appName, providerExpose.getConfigs());
}

describe('Expose 协议通信系统', () => {
  beforeEach(() => {
    clearAllExpose();
  });

  // ═════════════════════════════════════════════
  // register + list
  // ═════════════════════════════════════════════

  describe('register & list', () => {
    it('should register a provider and list it', () => {
      const pluginExpose = Expose.create().provide({
        name: 'help-image',
        description: '帮助图片生成',
        actions: {
          read: {
            description: '获取帮助图',
            returns: { url: 'string' },
            handler: () => 'https://example.com/help.png'
          }
        }
      });

      simulateRegister('plugin-a', pluginExpose);

      const items = expose.list('help-image');
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('plugin-a');
      expect(items[0].protocol).toBe('help-image');
      expect(items[0].description).toBe('帮助图片生成');
      expect(items[0].actions.read.description).toBe('获取帮助图');
    });

    it('should register multiple protocols via chained provide()', () => {
      const pluginExpose = Expose.create()
        .provide({ name: 'proto-1', description: 'desc-1', actions: { read: { description: 'r', handler: () => 1 } } })
        .provide({ name: 'proto-2', description: 'desc-2', actions: { read: { description: 'r', handler: () => 2 } } });

      simulateRegister('plugin-a', pluginExpose);

      const items = expose.list();
      expect(items).toHaveLength(2);
    });

    it('should return empty array for unknown protocol', () => {
      const items = expose.list('unknown');
      expect(items).toHaveLength(0);
    });
  });

  // ═════════════════════════════════════════════
  // invoke
  // ═════════════════════════════════════════════

  describe('invoke', () => {
    it('should invoke an action directly', () => {
      const pluginExpose = Expose.create().provide({
        name: 'help-image',
        description: '帮助图片',
        actions: {
          read: { description: '获取', handler: () => 'image-data' }
        }
      });

      simulateRegister('plugin-a', pluginExpose);

      const result = expose.invoke('help-image', 'plugin-a', 'read');
      expect(result).toBe('image-data');
    });

    it('should pass value to handler', () => {
      const pluginExpose = Expose.create().provide({
        name: 'config',
        description: '配置',
        actions: {
          write: {
            description: '写入',
            params: { key: 'string' },
            handler: (v: any) => `wrote:${v}`
          }
        }
      });

      simulateRegister('plugin-a', pluginExpose);

      const result = expose.invoke('config', 'plugin-a', 'write', 'theme=dark');
      expect(result).toBe('wrote:theme=dark');
    });

    it('should throw for unknown protocol', () => {
      expect(() => expose.invoke('nope', 'x', 'y')).toThrow('protocol "nope" not found');
    });

    it('should throw for unknown provider', () => {
      const pluginExpose = Expose.create().provide({
        name: 'proto',
        description: 'd',
        actions: { r: { description: 'd', handler: () => {} } }
      });

      simulateRegister('p', pluginExpose);

      expect(() => expose.invoke('proto', 'unknown', 'r')).toThrow('provider "unknown" not found');
    });

    it('should throw for unknown action', () => {
      const pluginExpose = Expose.create().provide({
        name: 'proto',
        description: 'd',
        actions: { r: { description: 'd', handler: () => {} } }
      });

      simulateRegister('p', pluginExpose);

      expect(() => expose.invoke('proto', 'p', 'missing')).toThrow('action "missing" not found');
    });
  });

  // ═════════════════════════════════════════════
  // item.invoke（list 返回的 invoke）
  // ═════════════════════════════════════════════

  describe('list item invoke', () => {
    it('should invoke via list item', () => {
      const pluginExpose = Expose.create().provide({
        name: 'help-image',
        description: '帮助图片',
        actions: {
          read: { description: '获取', handler: () => 'ok' }
        }
      });

      simulateRegister('plugin-a', pluginExpose);

      const items = expose.list('help-image');
      const result = items[0].invoke('read');
      expect(result).toBe('ok');
    });
  });

  // ═════════════════════════════════════════════
  // watch
  // ═════════════════════════════════════════════

  describe('watch', () => {
    it('should watch all protocols with global watcher', () => {
      const events: any[] = [];

      simulateRegister(
        'plugin-a',
        Expose.create().provide({
          name: 'proto-a',
          description: 'a',
          actions: { write: { description: 'w', handler: () => {} } }
        })
      );

      simulateRegister(
        'plugin-b',
        Expose.create().provide({
          name: 'proto-b',
          description: 'b',
          actions: { write: { description: 'w', handler: () => {} } }
        })
      );

      expose.watch(e => {
        events.push(e);
      });

      expose.invoke('proto-a', 'plugin-a', 'write');
      expose.invoke('proto-b', 'plugin-b', 'write');

      expect(events).toHaveLength(2);
      expect(events[0].protocol).toBe('proto-a');
      expect(events[1].protocol).toBe('proto-b');
    });

    it('should unsubscribe via returned function', () => {
      const events: any[] = [];

      simulateRegister(
        'p',
        Expose.create().provide({
          name: 'x',
          description: 'd',
          actions: { write: { description: 'w', handler: () => {} } }
        })
      );

      const unsub = expose.watch('x', e => events.push(e));
      expose.invoke('x', 'p', 'write');
      expect(events).toHaveLength(1);

      unsub();
      expose.invoke('x', 'p', 'write');
      expect(events).toHaveLength(1);
    });

    it('read action should NOT trigger watch', () => {
      const events: any[] = [];

      simulateRegister(
        'p',
        Expose.create().provide({
          name: 'x',
          description: 'd',
          actions: { read: { description: 'r', handler: () => 'val' } }
        })
      );

      expose.watch('x', e => events.push(e));
      expose.invoke('x', 'p', 'read');

      expect(events).toHaveLength(0);
    });
  });

  // ═════════════════════════════════════════════
  // schema — AI 发现
  // ═════════════════════════════════════════════

  describe('schema', () => {
    it('should return full schema for AI', () => {
      const pluginExpose = Expose.create().provide({
        name: 'help-image',
        description: '帮助图片生成',
        actions: {
          read: {
            description: '获取帮助图',
            returns: { url: 'string' },
            handler: () => 'img'
          },
          write: {
            description: '更新帮助图',
            params: { data: 'Buffer' },
            handler: () => {}
          }
        }
      });

      simulateRegister('plugin-a', pluginExpose);

      const schemas = expose.schema();
      expect(schemas).toHaveLength(1);

      const s = schemas[0];
      expect(s.protocol).toBe('help-image');
      expect(s.description).toBe('帮助图片生成');
      expect(s.providers).toEqual([{ name: 'plugin-a' }]);
      expect(s.actions.read.description).toBe('获取帮助图');
      expect(s.actions.read.returns).toEqual({ url: 'string' });
      expect(s.actions.write.params).toEqual({ data: 'Buffer' });
      expect(s.invoke).toContain('Expose.invoke');
    });
  });

  // ═════════════════════════════════════════════
  // disposeExpose — 插件卸载清理
  // ═════════════════════════════════════════════

  describe('disposeExpose', () => {
    it('should remove all providers of a plugin', () => {
      const pluginExpose = Expose.create()
        .provide({ name: 'proto-1', description: 'd1', actions: { r: { description: 'd', handler: () => {} } } })
        .provide({ name: 'proto-2', description: 'd2', actions: { r: { description: 'd', handler: () => {} } } });

      simulateRegister('plugin-a', pluginExpose);

      expect(expose.list()).toHaveLength(2);

      disposeExpose('plugin-a');

      expect(expose.list()).toHaveLength(0);
    });

    it('should not affect other plugins', () => {
      simulateRegister(
        'plugin-a',
        Expose.create().provide({
          name: 'shared',
          description: 'shared',
          actions: { r: { description: 'd', handler: () => 'a' } }
        })
      );

      simulateRegister(
        'plugin-b',
        Expose.create().provide({
          name: 'shared',
          description: 'shared',
          actions: { r: { description: 'd', handler: () => 'b' } }
        })
      );

      expect(expose.list('shared')).toHaveLength(2);

      disposeExpose('plugin-a');

      const remaining = expose.list('shared');
      expect(remaining).toHaveLength(1);
      expect(remaining[0].name).toBe('plugin-b');
    });
  });

  // ═════════════════════════════════════════════
  // 多 provider 同协议
  // ═════════════════════════════════════════════

  describe('multiple providers same protocol', () => {
    it('should list all providers', () => {
      simulateRegister(
        'plugin-a',
        Expose.create().provide({
          name: 'help-image',
          description: '帮助图片',
          actions: { read: { description: 'r', handler: () => 'a' } }
        })
      );

      simulateRegister(
        'plugin-b',
        Expose.create().provide({
          name: 'help-image',
          description: '帮助图片',
          actions: { read: { description: 'r', handler: () => 'b' } }
        })
      );

      const items = expose.list('help-image');
      expect(items).toHaveLength(2);
      expect(items.map(i => i.name).sort()).toEqual(['plugin-a', 'plugin-b']);
    });

    it('should invoke specific provider', () => {
      simulateRegister(
        'plugin-a',
        Expose.create().provide({
          name: 'help-image',
          description: '帮助图片',
          actions: { read: { description: 'r', handler: () => 'from-a' } }
        })
      );

      simulateRegister(
        'plugin-b',
        Expose.create().provide({
          name: 'help-image',
          description: '帮助图片',
          actions: { read: { description: 'r', handler: () => 'from-b' } }
        })
      );

      expect(expose.invoke('help-image', 'plugin-a', 'read')).toBe('from-a');
      expect(expose.invoke('help-image', 'plugin-b', 'read')).toBe('from-b');
    });
  });
});
