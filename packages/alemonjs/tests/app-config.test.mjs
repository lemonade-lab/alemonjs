import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createTestApp } from 'alemonjs/testing';
import { getAppConfig, shutdownLogger, logger } from 'alemonjs';

const root = mkdtempSync(join(tmpdir(), 'alemon-app-config-'));
const originalCwd = process.cwd();
process.chdir(root);
const entry = new URL('../lib/index.js', import.meta.url).href;
after(() => {
  process.chdir(originalCwd);
  rmSync(root, { recursive: true, force: true });
  shutdownLogger();
});

async function fixture(name, manifests) {
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
    `import { getAppConfig } from ${JSON.stringify(entry)};
export const read = () => getAppConfig();`
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
