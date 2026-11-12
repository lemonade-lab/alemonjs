import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import module from 'node:module';
import { once } from 'node:events';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test, { after } from 'node:test';
import {
  ChildrenApp,
  getRuntimeApp,
  loadAppPackage,
  loadModels,
  registerRuntimeApp,
  reloadAppPackage,
  Response,
  scheduleList,
  shutdownLogger,
  unloadAppPackage,
  updateRuntimeAppStatus
} from 'alemonjs';
import { createTestApp } from 'alemonjs/testing';
import Koa from 'koa';
import router from '../lib/application/runtime/http/routers/router.js';

after(() => shutdownLogger());

test('hot reload replaces package dependencies and file handlers, and awaits disposal before retry', { skip: !module.registerHooks }, async t => {
  const nodeModules = fileURLToPath(new URL('../node_modules/', import.meta.url));
  await mkdir(nodeModules, { recursive: true });
  const directory = await mkdtemp(join(nodeModules, 'hot-app-'));
  const name = directory.split('/').at(-1).toLowerCase();
  // mkdtemp can use uppercase characters. Use a valid npm name for the fixture.
  const packageDir = join(directory, 'node_modules', name);
  await mkdir(join(packageDir, 'response'), { recursive: true });
  const installed = join(nodeModules, name + '-fixture');
  const appName = name + '-fixture';
  await symlink(packageDir, installed, 'dir');
  const app = createTestApp();
  t.after(async () => {
    await app.dispose();
    await rm(installed, { force: true });
    await rm(directory, { recursive: true, force: true });
  });

  const entry = new URL('../lib/index.js', import.meta.url).href;
  const changes = [];
  const record = Symbol.for(appName);
  globalThis[record] = value => changes.push(value);
  t.after(() => delete globalThis[record]);
  const gateKey = Symbol.for(appName + '-ready');
  let enteredReady;
  let finishReady;
  const entered = new Promise(resolve => {
    enteredReady = resolve;
  });
  const ready = new Promise(resolve => {
    finishReady = resolve;
  });
  globalThis[gateKey] = () => {
    enteredReady();
    return ready;
  };
  t.after(() => delete globalThis[gateKey]);
  const track = `globalThis[Symbol.for(${JSON.stringify(appName)})]`;
  await writeFile(join(packageDir, 'package.json'), JSON.stringify({ type: 'module', exports: { '.': { import: './index.js' } } }));
  await writeFile(
    join(packageDir, 'index.js'),
    `
    import { defineChildren, scheduleInterval } from ${JSON.stringify(entry)};
    import { version } from './version.js';
    export default defineChildren({
      onCreated() { scheduleInterval(() => {}, 1000); ${track}('created:' + version); },
      async onReady() {
        if (version === 'broken') throw new Error('broken startup');
        if (version === 'v2') await globalThis[Symbol.for(${JSON.stringify(appName + '-ready')})]();
      },
      async onDispose() { await Promise.resolve(); ${track}('disposed:' + version); }
    });
  `
  );
  await writeFile(
    join(packageDir, 'response', 'res.js'),
    `
    import { onResponse } from ${JSON.stringify(entry)};
    export default onResponse(['message.create'], async () => {
      const { version } = await import('../version.js');
      ${track}('response:' + version);
    });
  `
  );
  const apiDir = join(packageDir, 'route', 'api');
  await mkdir(apiDir, { recursive: true });
  await writeFile(join(apiDir, 'version.js'), "import { version } from '../../version.js'; export const GET = ctx => { ctx.body = version; };");
  await writeFile(
    join(apiDir, '_middleware.js'),
    "import { version } from '../../version.js'; export default async (ctx, next) => { ctx.set('X-Version', version); await next(); };"
  );
  const http = new Koa();
  const routes = router.routes();
  http.use((ctx, next) => app.run(() => routes(ctx, next)));
  const server = http.listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => server.close(resolve)));
  await once(server, 'listening');
  const api = () => fetch(`http://127.0.0.1:${server.address().port}/apps/${appName}/api/version`);
  const checkApi = async version => {
    const response = await api();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('X-Version'), version);
    assert.equal(await response.text(), version);
  };

  const update = version => writeFile(join(packageDir, 'version.js'), `export const version = ${JSON.stringify(version)};`);
  let message = 0;
  const dispatch = () => app.dispatch(app.events.groupMessage({ userId: String(++message) }));
  const schedules = () => app.run(() => scheduleList(appName));

  await update('v1');
  const initial = await app.run(() => Promise.all([loadAppPackage(appName), loadAppPackage(appName)]));
  assert.equal(initial[0], initial[1]);
  await checkApi('v1');
  await dispatch();
  assert.equal(schedules().length, 1);

  await update('v2');
  const reloading = app.run(() => reloadAppPackage(appName));
  try {
    await Promise.race([entered, reloading]);
    assert.equal(
      app.run(() => getRuntimeApp(appName).status),
      'loading'
    );
    await dispatch();
    assert.deepEqual(changes, ['created:v1', 'response:v1', 'disposed:v1', 'created:v2']);
    const loading = await api();
    assert.equal(loading.status, 503);
    await loading.text();
  } finally {
    finishReady();
    await reloading;
  }
  await checkApi('v2');
  await dispatch();
  assert.equal(schedules().length, 1);
  assert.deepEqual(changes, ['created:v1', 'response:v1', 'disposed:v1', 'created:v2', 'response:v2']);

  await update('broken');
  await assert.rejects(
    app.run(() => reloadAppPackage(appName)),
    /broken startup/
  );
  assert.equal(
    app.run(() => getRuntimeApp(appName).status),
    'failed'
  );
  assert.equal(schedules().length, 0);
  await dispatch();
  assert.deepEqual(changes.slice(-3), ['disposed:v2', 'created:broken', 'disposed:broken']);

  await update('v3');
  await app.run(() => loadAppPackage(appName));
  await dispatch();
  await app.run(() => unloadAppPackage(appName));
  const disposed = await api();
  assert.equal(disposed.status, 410);
  await disposed.text();
  await dispatch();
  assert.equal(
    app.run(() => getRuntimeApp(appName).status),
    'disposed'
  );
  assert.equal(schedules().length, 0);
  assert.deepEqual(changes.slice(-3), ['created:v3', 'response:v3', 'disposed:v3']);
});

test('hot plugging follows current apps.order, including disabled startup entries and ties', { skip: !module.registerHooks }, async t => {
  const nodeModules = fileURLToPath(new URL('../node_modules/', import.meta.url));
  await mkdir(nodeModules, { recursive: true });
  const directory = await mkdtemp(join(nodeModules, 'hot-order-'));
  const prefix = directory.split('/').at(-1).toLowerCase();
  const [a, b, c, extra] = ['a', 'b', 'c', 'extra'].map(suffix => prefix + '-' + suffix);
  const app = createTestApp();
  const installed = [];
  t.after(async () => {
    await app.dispose();
    await Promise.all(installed.map(path => rm(path, { force: true })));
    await rm(directory, { recursive: true, force: true });
  });

  const observed = [];
  const key = Symbol.for(prefix);
  globalThis[key] = observed;
  t.after(() => delete globalThis[key]);
  const entry = new URL('../lib/index.js', import.meta.url).href;
  for (const name of [a, b, c, extra]) {
    const packageDir = join(directory, name);
    await mkdir(join(packageDir, 'response'), { recursive: true });
    await writeFile(join(packageDir, 'package.json'), JSON.stringify({ type: 'module', main: './index.js' }));
    await writeFile(join(packageDir, 'index.js'), 'export default { _name: "app", callback: {} };');
    await writeFile(
      join(packageDir, 'response', 'res.js'),
      `import { onResponse } from ${JSON.stringify(entry)};
      export default onResponse('message.create', (_event, next) => {
        globalThis[Symbol.for(${JSON.stringify(prefix)})].push(${JSON.stringify(name)});
        next();
      });`
    );
    const path = join(nodeModules, name);
    await symlink(packageDir, path, 'dir');
    installed.push(path);
  }

  let message = 0;
  const checkOrder = async (...expected) => {
    observed.length = 0;
    await app.dispatch(app.events.groupMessage({ userId: String(++message) }));
    assert.deepEqual(observed, expected);
  };

  app.configure({ apps: { [c]: { order: 30 }, [a]: { order: 10 }, [b]: { enabled: false, order: 20 } } });
  await app.run(() => loadModels());
  await checkOrder(a, c);

  await app.run(() => loadAppPackage(extra));
  await app.run(() => loadAppPackage(b));
  await checkOrder(a, b, c, extra);

  app.configure({ apps: { [c]: { order: 0 }, [b]: { enabled: false, order: 10 }, [a]: { order: 10 } } });
  await app.run(() => unloadAppPackage(b));
  await checkOrder(c, a, extra);
  await app.run(() => loadAppPackage(b));
  await checkOrder(c, b, a, extra);

  app.configure({ apps: { [a]: { order: 0 }, [b]: { enabled: false, order: 1 }, [c]: { order: 2 } } });
  await app.run(() => reloadAppPackage(c));
  await checkOrder(a, b, c, extra);
});

test('ready transitions invalidate the shared event store cache', t => {
  const name = 'cached-hot-app';
  const app = new ChildrenApp(name);
  const response = new Response();
  const isVisible = () => response.value.some(item => item.appName === name);
  t.after(() => app.un());

  registerRuntimeApp({ name, kind: 'plugin', enabled: true, status: 'loading', rootDir: '', mainPath: '' });
  app.pushResponse([{ input: '', dir: '', path: '', name: 'res.js', appName: name }]);
  app.on();
  assert.equal(isVisible(), false);

  updateRuntimeAppStatus(name, 'ready');
  assert.equal(isVisible(), true);

  updateRuntimeAppStatus(name, 'disposed');
  assert.equal(isVisible(), false);
});
