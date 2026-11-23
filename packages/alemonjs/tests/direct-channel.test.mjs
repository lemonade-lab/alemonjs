import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { EventEmitter, once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import { createDirectClient, generateSocketPath } from '../lib/common/direct-channel.js';

const directChannelURL = new URL('../lib/common/direct-channel.js', import.meta.url);
const moduleSource = `
  import { createDirectServer } from ${JSON.stringify(directChannelURL.href)};
  const channel = await createDirectServer(process.argv[1], message => channel.send({ received: message }));
  process.send('listening');
`;

async function startModule(t, socketPath) {
  const child = spawn(process.execPath, ['--input-type=module', '--eval', moduleSource, socketPath], {
    stdio: ['ignore', 'ignore', 'inherit', 'ipc']
  });
  const exited = once(child, 'exit');
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      await exited;
    }
  });
  const ready = once(child, 'message', { signal: t.signal });
  assert.equal(await Promise.race([ready.then(([message]) => message), exited.then(([code, signal]) => `exited (${code}, ${signal})`)]), 'listening');

  return { child, exited };
}

test('platform Direct-IPC reconnects after the module child is killed', { timeout: 10000 }, async t => {
  const socketPath = generateSocketPath();
  if (process.platform !== 'win32') {
    t.after(() => rmSync(socketPath, { force: true }));
  }
  const events = new EventEmitter();
  const first = await startModule(t, socketPath);
  const platform = await createDirectClient(socketPath, message => events.emit('reply', message), 1, 20);
  t.after(() => platform.close());

  const before = once(events, 'reply', { signal: t.signal });
  assert.equal(platform.send('before restart'), true);
  assert.deepEqual(await before, [{ received: 'before restart' }]);

  first.child.kill('SIGKILL');
  assert.deepEqual(await first.exited, [null, 'SIGKILL']);
  // Leave the listener absent beyond the initial one-attempt connection budget.
  await delay(100, undefined, { signal: t.signal });
  assert.equal(platform.send('during restart'), false);

  await startModule(t, socketPath);
  const after = once(events, 'reply', { signal: t.signal });
  while (!platform.send('after restart')) {
    await delay(10, undefined, { signal: t.signal });
  }
  assert.deepEqual(await after, [{ received: 'after restart' }]);
});

test('initial connection failure rejects so the caller can fall back', { timeout: 3000 }, async () => {
  await assert.rejects(
    createDirectClient(generateSocketPath(), () => {}, 2, 10),
    { code: 'ENOENT' }
  );
});

test('actions and API calls fail immediately when direct transport has no peer', { timeout: 10000 }, async t => {
  const directory = mkdtempSync(join(tmpdir(), 'alemon-direct-test-'));
  const previousConfig = process.env.CFG_PATH;
  t.after(() => {
    if (previousConfig === undefined) {
      delete process.env.CFG_PATH;
    } else {
      process.env.CFG_PATH = previousConfig;
    }
    rmSync(directory, { recursive: true, force: true });
  });
  process.env.CFG_PATH = join(directory, 'alemon.config.yaml');
  const { ResultCode, getConfig } = await import('../lib/common/index.js');
  const { sendAction } = await import('../lib/application/runtime/cbp/processor/actions.js');
  const { sendAPI } = await import('../lib/application/runtime/cbp/processor/api.js');
  const { actionRequestTimeouts, apiRequestTimeouts } = await import('../lib/application/runtime/cbp/processor/request-registry.js');
  const { setDirectSend } = await import('../lib/application/runtime/cbp/processor/transport.js');
  setDirectSend(() => false);
  t.after(() => {
    setDirectSend(null);
    getConfig().dispose();
    for (const timer of [...actionRequestTimeouts.values(), ...apiRequestTimeouts.values()]) {
      clearTimeout(timer);
    }
  });

  const request = { action: 'test' };
  const action = sendAction({ ...request });
  const api = sendAPI({ ...request });
  assert.equal(actionRequestTimeouts.size, 0);
  assert.equal(apiRequestTimeouts.size, 0);
  assert.equal((await action)[0].code, ResultCode.Fail);
  assert.equal((await api)[0].code, ResultCode.Fail);
});
