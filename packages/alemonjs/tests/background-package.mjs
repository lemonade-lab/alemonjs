// Verify the actual npm artifact in a fresh consumer, never an adjacent checkout import.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const repository = fileURLToPath(new URL('../../../', import.meta.url));
const root = await mkdtemp(join(tmpdir(), 'alemonjs-background-package-'));
const run = (file, args, cwd = root) =>
  execFileSync(file, args, { cwd, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, env: { ...process.env, LOG_FILE: 'false', LOG_LEVEL: 'off' } });

try {
  const packed = JSON.parse(run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', root], packageRoot))[0];
  console.log(`Local artifact integrity: ${packed.integrity}`);
  for (const path of ['lib/application/background.js', 'lib/application/background.d.ts', 'lib/index.js', 'lib/index.d.ts', 'lib/testing/index.js']) {
    assert.ok(
      packed.files.some(file => file.path === path),
      `package is missing ${path}`
    );
  }
  console.log(`Packed ${packed.name}@${packed.version}; background runtime, declarations and testing exports included.`);
  await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'background-consumer-fixture', private: true, type: 'module' }));
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--omit=dev', join(root, packed.filename)]);
  console.log('Installed the tarball in an isolated consumer without modifying either application.');
  const source = (await readFile(join(packageRoot, 'tests/background.test.mjs'), 'utf8'))
    .replaceAll("'../lib/index.js'", "'alemonjs'")
    .replaceAll("'../lib/testing/index.js'", "'alemonjs/testing'");
  await writeFile(join(root, 'background.test.mjs'), source);
  console.log(run(process.execPath, ['--test', 'background.test.mjs']));
  // Node 22's synchronous ESM loading lets both module formats share the same
  // registry and AsyncLocalStorage. A separate CJS bundle would split them.
  const commonjs = source
    .replace("import test from 'node:test';", "const test = require('node:test');")
    .replace("import assert from 'node:assert/strict';", "const assert = require('node:assert/strict');")
    .replace(/import (\{[^}]+\}) from 'alemonjs';/u, "const $1 = require('alemonjs');")
    .replace(/import (\{[^}]+\}) from 'alemonjs\/testing';/u, "const $1 = require('alemonjs/testing');");
  assert.doesNotMatch(commonjs, /^import /mu);
  await writeFile(join(root, 'background.test.cjs'), commonjs);
  console.log(run(process.execPath, ['--test', 'background.test.cjs']));
  await writeFile(
    join(root, 'interop.mjs'),
    `import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
for (const path of ['alemonjs', 'alemonjs/markdown', 'alemonjs/utils', 'alemonjs/platform', 'alemonjs/common', 'alemonjs/core', 'alemonjs/application', 'alemonjs/testing']) {
  const esm = await import(path), cjs = require(path);
  for (const name of Object.keys(esm)) assert.strictEqual(cjs[name], esm[name], path + ':' + name);
}
require('alemonjs').shutdownLogger();
`
  );
  run(process.execPath, ['interop.mjs']);
  console.log('Installed CommonJS runtime and shared ESM/CommonJS export identities passed.');
  await writeFile(
    join(root, 'consumer.ts'),
    `import { createBackgroundRunner } from 'alemonjs';
const run = createBackgroundRunner(async (id: string, count: number) => ({ id, count }));
const value: Promise<{ id: string; count: number }> = run('player', 1);
// @ts-expect-error preserve callback argument types in the package declaration
run(123, 'wrong');
void value;
`
  );
  run(process.execPath, [
    join(repository, 'node_modules/typescript/bin/tsc'),
    '--noEmit',
    '--skipLibCheck',
    '--strict',
    '--target',
    'ES2022',
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    'consumer.ts'
  ]);
  await writeFile(
    join(root, 'consumer.cts'),
    `import framework = require('alemonjs');
const run = framework.createBackgroundRunner(async (id: string) => id);
const value: Promise<string> = run('player');
// @ts-expect-error CommonJS consumers retain callback argument types too
run(123);
void value;
`
  );
  run(process.execPath, [
    join(repository, 'node_modules/typescript/bin/tsc'),
    '--noEmit',
    '--skipLibCheck',
    '--strict',
    '--target',
    'ES2022',
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    'consumer.cts'
  ]);
  console.log('ESM/CommonJS runtime and installed TypeScript declaration checks passed. No package was published.');
} finally {
  await rm(root, { recursive: true, force: true });
}
