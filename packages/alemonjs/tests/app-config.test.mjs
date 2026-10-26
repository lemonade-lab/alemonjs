import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { createTestApp } from 'alemonjs/testing';
import { getAppConfig, getAppConfigValue, getConfig, shutdownLogger, logger } from 'alemonjs';

const root = mkdtempSync(join(tmpdir(), 'alemon-app-config-'));
const originalCwd = process.cwd();
mkdirSync(join(root, 'logs'));
process.chdir(root);
const entry = new URL('../lib/index.js', import.meta.url).href;
after(async () => {
  await shutdownLogger();
  process.chdir(originalCwd);
  rmSync(root, { recursive: true, force: true });
});

async function fixture(name, manifests, method = 'getAppConfigValue') {
  const directory = join(root, name);
  for (const [file, value] of Object.entries(manifests)) {
    const target = join(directory, file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, typeof value === 'string' ? value : JSON.stringify(value));
  }
  const file = join(directory, 'dist', 'nested', '调用 file.mjs');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(
    file,
    `import { ${method} } from ${JSON.stringify(entry)};
export const read = () => ${method}();`
  );
  return (await import(pathToFileURL(file).href)).read;
}

function appFor(t, config) {
  const app = createTestApp({ config });
  t.after(() => app.dispose());
  return app;
}

test('public export resolves the calling package and reads fresh scoped configuration', async t => {
  assert.equal(typeof getAppConfig, 'function');
  const read = await fixture('scoped', {
    'package.json': { name: '@example/my-app' },
    'dist/package.json': { type: 'module' }
  });
  const app = appFor(t, { '@example/my-app': { enabled: true }, alemonjs: { wrong: true } });
  assert.deepEqual(app.run(read), { enabled: true });
  app.configure({ '@example/my-app': { enabled: false } });
  assert.deepEqual(app.run(read), { enabled: false });
  const other = appFor(t, { '@example/my-app': { value: 2 } });
  assert.deepEqual(other.run(read), { value: 2 });
});

test('nearest named package wins over parent and returns empty for missing configuration', async t => {
  const read = await fixture('nearest', {
    'package.json': { name: 'parent' },
    'dist/package.json': { name: 'child' }
  });
  const app = appFor(t, { parent: { wrong: true }, child: { correct: true } });
  assert.deepEqual(app.run(read), { correct: true });
  app.configure({ parent: { wrong: true } });
  assert.deepEqual(app.run(read), {});
});

test('invalid manifests do not fall through to another application', async t => {
  const read = await fixture('invalid', {
    'package.json': { name: 'parent' },
    'dist/package.json': '{broken'
  });
  assert.deepEqual(appFor(t, { parent: { wrong: true } }).run(read), {});
});

test('missing packages and non-object configuration return empty objects', async t => {
  const missing = await fixture('missing', {});
  const read = await fixture('values', { 'package.json': { name: 'example' } });
  const app = appFor(t, {});
  assert.deepEqual(app.run(missing), {});
  for (const value of [null, false, 'text', 1, []]) {
    app.configure({ example: value });
    assert.deepEqual(app.run(read), {});
  }
});

test('includes cwd itself but never reads its parent manifest', async t => {
  const read = await fixture('boundary', {});
  const app = appFor(t, { outside: { wrong: true }, current: { correct: true } });
  const warn = t.mock.method(logger, 'warn', () => {});
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'outside' }));
  process.chdir(join(root, 'boundary'));
  try {
    assert.deepEqual(app.run(read), {});
    assert.equal(warn.mock.callCount(), 1);
    writeFileSync('package.json', JSON.stringify({ name: 'current' }));
    assert.deepEqual(app.run(read), { correct: true });
    assert.equal(warn.mock.callCount(), 1);
  } finally {
    process.chdir(root);
    rmSync(join(root, 'package.json'));
  }
});

test('outside callers and sibling paths with the same prefix only warn', async t => {
  const read = await fixture('prefix-other', { 'package.json': { name: 'outside' } });
  mkdirSync(join(root, 'prefix'));
  const warn = t.mock.method(logger, 'warn', () => {});
  process.chdir(join(root, 'prefix'));
  try {
    assert.deepEqual(appFor(t, { outside: { wrong: true } }).run(read), {});
    assert.equal(warn.mock.callCount(), 1);
  } finally {
    process.chdir(root);
  }
});

test('invalid manifest shapes warn instead of inheriting parent configuration', async t => {
  const warn = t.mock.method(logger, 'warn', () => {});
  const app = appFor(t, { parent: { wrong: true } });
  for (const [index, value] of [null, [], { name: 42 }, { name: '' }].entries()) {
    const read = await fixture(`invalid-shape-${index}`, {
      'package.json': { name: 'parent' },
      'dist/package.json': value
    });
    assert.deepEqual(app.run(read), {});
  }
  assert.equal(warn.mock.callCount(), 4);
});

test('manifest symlinks cannot read beyond cwd', async t => {
  const read = await fixture('symlink-boundary', {});
  const outside = join(root, 'outside.json');
  writeFileSync(outside, JSON.stringify({ name: 'outside' }));
  symlinkSync(outside, join(root, 'symlink-boundary', 'package.json'));
  const warn = t.mock.method(logger, 'warn', () => {});
  process.chdir(join(root, 'symlink-boundary'));
  try {
    assert.deepEqual(appFor(t, { outside: { wrong: true } }).run(read), {});
    assert.equal(warn.mock.callCount(), 1);
  } finally {
    process.chdir(root);
  }
});

test('manager stays bound to its configuration scope and preserves other apps on save', async t => {
  const manage = await fixture('managed', { 'package.json': { name: 'managed' } }, 'getAppConfig');
  const app = appFor(t, { managed: { enabled: true }, other: { keep: 1 }, language: 'en-US' });
  const manager = app.run(manage);
  assert.equal(typeof getAppConfigValue, 'function');
  assert.equal(manager.name, 'managed');
  assert.deepEqual(manager.value, { enabled: true });
  manager.saveValue({ enabled: false });
  assert.deepEqual(
    app.run(() => getConfig().value),
    {
      managed: { enabled: false },
      other: { keep: 1 },
      language: 'en-US'
    }
  );
  app.configure({ managed: { updated: true } });
  assert.deepEqual(manager.value, { updated: true });
  assert.equal(manager.path, null);
  manager.dispose();
});

test('unresolved manager is usable without creating or overwriting framework config', async t => {
  const manage = await fixture('unresolved-manager', {}, 'getAppConfig');
  const app = appFor(t, { other: { keep: true } });
  const warn = t.mock.method(logger, 'warn', () => {});
  const manager = app.run(manage);
  assert.equal(manager.name, undefined);
  assert.deepEqual(manager.value, {});
  manager.saveValue({ ignored: true });
  manager.reload();
  manager.onWatch(() => assert.fail('unresolved listener'))();
  manager.dispose();
  assert.equal(warn.mock.callCount(), 2);
  assert.deepEqual(
    app.run(() => getConfig().value),
    { other: { keep: true } }
  );
});

test('file persistence, reload and app-only subscriptions preserve other listeners', async t => {
  const manage = await fixture('watched', { 'package.json': { name: 'watched' } }, 'getAppConfig');
  const previousConfig = global.__config;
  const previousPath = process.env.CFG_PATH;
  const file = join(root, 'watch-config.json');
  process.env.CFG_PATH = file;
  delete global.__config;
  const framework = getConfig();
  t.after(() => {
    framework.dispose();
    global.__config = previousConfig;
    if (previousPath === undefined) delete process.env.CFG_PATH;
    else process.env.CFG_PATH = previousPath;
  });
  framework.saveValue({ watched: { count: 0 }, other: { keep: true } });
  const manager = manage();
  const events = [];
  const peerEvents = [];
  const stop = manager.onWatch(value => events.push(value.count));
  const peer = manage();
  peer.onWatch(value => peerEvents.push(value.count));
  async function change(write) {
    // Allow the native file watcher to become active before the first write.
    await delay(100);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error('configuration watch timed out'));
      }, 3000);
      const unsubscribe = framework.onWatch(() => {
        clearTimeout(timer);
        unsubscribe();
        resolve();
      });
      write();
    });
  }
  await change(() => framework.saveValue({ watched: { count: 0 }, other: { keep: false } }));
  assert.deepEqual(events, []);
  await change(() => manager.saveValue({ count: 1 }));
  assert.deepEqual(events, [1]);
  assert.deepEqual(framework.value.other, { keep: false });
  assert.match(readFileSync(file, 'utf8'), /count: 1/);
  stop();
  await change(() => manager.saveValue({ count: 2 }));
  assert.deepEqual(events, [1]);
  manager.onWatch(value => events.push(value.count));
  manager.dispose();
  await change(() => manager.saveValue({ count: 3 }));
  assert.deepEqual(events, [1]);
  assert.deepEqual(peerEvents, [1, 2, 3]);
  peer.dispose();
  writeFileSync(file, JSON.stringify({ watched: { count: 4 }, other: { keep: false } }));
  manager.reload();
  assert.deepEqual(manager.value, { count: 4 });
  assert.equal(manager.path, file);
});
