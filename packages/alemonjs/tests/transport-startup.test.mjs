import test from 'node:test';
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { WebSocketServer } from 'ws';

test('transport handshake completes before module import and blocking onCreated', { timeout: 10000 }, async t => {
  const dir = mkdtempSync(join(tmpdir(), 'alemon-startup-'));
  const marker = join(dir, 'imported');
  writeFileSync(join(dir, 'alemon.config.yaml'), 'apps: {}\n');
  writeFileSync(
    join(dir, 'app.mjs'),
    `
    import { writeFileSync } from 'node:fs';
    writeFileSync(${JSON.stringify(marker)}, 'yes');
    export default defineChildren({
      onCreated() {
        process.send({ type: 'test_created' });
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 150);
      },
      register() { return {}; }
    });
  `
  );
  let accept;
  let attempted;
  const attempt = new Promise(resolve => {
    attempted = resolve;
  });
  const server = new WebSocketServer({
    port: 0,
    verifyClient(_info, done) {
      accept = done;
      attempted();
    }
  });
  await new Promise(resolve => server.once('listening', resolve));
  const env = {
    ...process.env,
    LOG_FILE: 'false',
    input: 'app.mjs',
    url: `ws://127.0.0.1:${server.address().port}`,
    login: '',
    platform: '',
    serverPort: '',
    __ALEMON_DIRECT_SOCK: '',
    __ALEMON_IPC: '',
    CFG_PATH: join(dir, 'alemon.config.yaml')
  };
  const child = fork(fileURLToPath(new URL('../lib/client.js', import.meta.url)), [], { cwd: dir, env, stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = new Promise(resolve => child.once('exit', resolve));
      child.kill('SIGKILL');
      await exited;
    }
    for (const socket of server.clients) socket.terminate();
    await new Promise(resolve => server.close(resolve));
    rmSync(dir, { recursive: true, force: true });
  });
  const messages = [];
  const ready = new Promise((resolve, reject) => {
    child.on('message', message => {
      messages.push(message.type);
      if (message.type === 'ready') child.send({ type: 'start' });
      if (message.type === 'app_ready') resolve();
      if (message.type === 'boot_error') reject(new Error(JSON.stringify(message)));
    });
    child.once('exit', code => reject(new Error(`child exited: ${code}`)));
  });
  await attempt;
  await delay(150);
  assert.equal(existsSync(marker), false, 'module must not import before transport is open');
  assert.equal(messages.includes('test_created'), false);
  accept(true);
  await ready;
  assert.ok(messages.indexOf('transport_ready') < messages.indexOf('test_created'));
  assert.ok(messages.indexOf('test_created') < messages.indexOf('app_ready'));
});
