import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBackgroundRunner,
  Expose,
  registerExpose,
  getCurrentAppName,
  getCurrentEvent,
  getCurrentNext,
  getCurrentPhase,
  getExposeContext,
  shutdownLogger
} from '../lib/index.js';
import { createTestApp } from '../lib/testing/index.js';

test.after(() => shutdownLogger());
const empty = { type: 'object', properties: {}, additionalProperties: false };

test('background runner retains its plugin while clearing event and parent invocation across awaits', async t => {
  const app = createTestApp();
  t.after(() => app.dispose());
  let background;
  const calls = [];
  const event = app.events.privateMessage({ userId: 'player-one', text: 'schedule', messageId: 'original' });
  const run = await app.runHandler(
    async () => {
      registerExpose('provider', [
        {
          name: 'background-test.v1',
          description: 'fixture',
          actions: {
            execute: Expose.action({
              effect: 'write',
              description: 'requires a delegated identity in real implementations',
              inputSchema: empty,
              outputSchema: empty,
              handler: (_input, context) => {
                calls.push({ caller: context.callerApp, parent: context.parentCallId, event: getCurrentEvent(), next: getCurrentNext() });
                return {};
              }
            })
          }
        }
      ]);
      background = createBackgroundRunner(async value => {
        assert.equal(getCurrentAppName(), 'scheduler');
        assert.equal(getCurrentEvent(), undefined);
        assert.equal(getCurrentNext(), undefined);
        assert.equal(getCurrentPhase(), undefined);
        assert.equal(getExposeContext(), undefined);
        await Promise.resolve();
        assert.equal(getCurrentEvent(), undefined);
        const result = await Expose.create().call('background-test.v1', 'provider', 'execute', {});
        assert.equal(result.ok, true);
        return value;
      });
      assert.equal(await background('first'), 'first');
      assert.equal(getCurrentEvent(), event);
      assert.equal(getCurrentAppName(), 'scheduler');
    },
    event,
    'scheduler'
  );
  assert.deepEqual(run.errors, []);
  const second = await app.runHandler(
    async () => {
      assert.equal(await background('second'), 'second');
      assert.equal(getCurrentAppName(), 'unrelated');
      assert.equal(getCurrentEvent().UserId, 'player-two');
    },
    app.events.privateMessage({ userId: 'player-two' }),
    'unrelated'
  );
  assert.deepEqual(second.errors, []);
  assert.deepEqual(
    calls,
    [1, 2].map(() => ({ caller: 'scheduler', parent: undefined, event: undefined, next: undefined }))
  );
  await app.dispose();
  assert.throws(() => background('disposed'), /disposed/);
});

test('runner created inside a provider uses provider identity and drops the original caller lineage', async t => {
  const app = createTestApp();
  t.after(() => app.dispose());
  let background;
  let caller;
  const run = await app.runHandler(
    async () => {
      registerExpose('issuer', [
        {
          name: 'issuer.v1',
          description: 'issuer',
          actions: {
            prepare: Expose.action({
              effect: 'read',
              description: 'capture',
              inputSchema: empty,
              outputSchema: empty,
              handler: () => {
                background = createBackgroundRunner(() => Expose.create().call('target.v1', 'target', 'inspect', {}));
                return {};
              }
            })
          }
        }
      ]);
      registerExpose('target', [
        {
          name: 'target.v1',
          description: 'target',
          actions: {
            inspect: Expose.action({
              effect: 'read',
              description: 'inspect',
              inputSchema: empty,
              outputSchema: empty,
              handler: (_input, context) => {
                caller = context.callerApp;
                assert.equal(context.parentCallId, undefined);
                assert.equal(getCurrentEvent(), undefined);
                return {};
              }
            })
          }
        }
      ]);
      assert.equal((await Expose.create().call('issuer.v1', 'issuer', 'prepare', {})).ok, true);
      assert.equal((await background()).ok, true);
      assert.equal(caller, 'issuer');
    },
    app.events.privateMessage({ userId: 'player' }),
    'host'
  );
  assert.deepEqual(run.errors, []);
});

test('unscoped code cannot choose a plugin identity by constructing a runner', () => {
  assert.throws(() => createBackgroundRunner(() => undefined), /plugin context/);
});
