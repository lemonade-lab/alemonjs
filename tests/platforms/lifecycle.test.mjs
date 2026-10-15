import test from 'node:test';
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

for (const mode of ['bootstrap', 'legacy'])
  test(`${mode} waits for asynchronous platform cleanup`, async t => {
    const directory = await mkdtemp(join(tmpdir(), 'alemon-lifecycle-'));
    const marker = join(directory, 'stopped');
    const entry = join(directory, 'entry.mjs');
    const cleanup = `() => ({stop: async () => {await new Promise(r => setTimeout(r, 30)); await writeFile(${JSON.stringify(
      marker
    )}, 'clean');}})`;
    const define = new URL('../../packages/alemonjs/lib/platform/define-platform.js', import.meta.url).href;
    const source =
      `import {writeFile} from 'node:fs/promises';\n` +
      (mode === 'bootstrap'
        ? `export default ${cleanup};`
        : `import {definePlatform} from ${JSON.stringify(define)}; definePlatform({main: ${cleanup}, name: 'test'});`);
    await writeFile(entry, source);
    const bootstrap = fileURLToPath(new URL('../../packages/alemonjs/lib/platform-bootstrap.js', import.meta.url));
    const child = fork(mode === 'bootstrap' ? bootstrap : entry, [], {
      execArgv: [],
      env: { ...process.env, LOG_FILE: 'false', __ALEMON_PLATFORM_ENTRY: entry },
      stdio: ['ignore', 'ignore', 'ignore', 'ipc']
    });
    t.after(async () => {
      if (child.exitCode === null) child.kill();
      await rm(directory, { recursive: true, force: true });
    });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Lifecycle child timeout')), 5000);
      child.on('message', raw => {
        const message = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (message.type === 'ready') child.send({ type: 'start' });
        if (message.type === 'app_ready') child.send({ type: 'stop' });
        if (mode === 'legacy' && message.type === 'ready') setTimeout(() => child.send({ type: 'stop' }), 50);
      });
      child.on('error', reject);
      child.on('exit', code => {
        clearTimeout(timer);
        code === 0 ? resolve() : reject(new Error(`Child exit ${code}`));
      });
    });
    assert.equal(await readFile(marker, 'utf8'), 'clean');
  });
