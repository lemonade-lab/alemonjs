import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { normalizeAppsConfig, loadConfiguredApps, shutdownLogger } from '../lib/index.js';
after(() => shutdownLogger());

test('module keys are authoritative; ordering is stable and disabled entries remain', () => {
  assert.deepEqual(
    normalizeAppsConfig({ late: { order: 20 }, disabled: { enabled: false, order: 0 }, first: { order: 10, name: 'wrong' }, tied: { order: 10 } }),
    [
      { name: 'disabled', enabled: false, order: 0 },
      { name: 'first', enabled: true, order: 10 },
      { name: 'tied', enabled: true, order: 10 },
      { name: 'late', enabled: true, order: 20 }
    ]
  );
});
test('legacy maps and name arrays remain supported', () => {
  assert.deepEqual(normalizeAppsConfig({ a: true, b: false }), [
    { name: 'a', enabled: true, order: 0 },
    { name: 'b', enabled: false, order: 1 }
  ]);
  assert.deepEqual(
    normalizeAppsConfig(['a', 'a', 'b']).map(app => app.name),
    ['a', 'b']
  );
});
test('malformed values cannot enable applications accidentally', () => {
  assert.deepEqual(normalizeAppsConfig({ a: 'false', b: null, c: [], d: { enabled: 'false' }, e: { order: Infinity } }), []);
  assert.deepEqual(normalizeAppsConfig('a'), []);
});
test('initialization finishes in configured order and skips disabled modules', async () => {
  const events = [];
  await loadConfiguredApps({ b: { order: 20 }, a: { order: 10 }, off: false }, async name => {
    events.push(`start:${name}`);
    await new Promise(resolve => setTimeout(resolve, 5));
    events.push(`end:${name}`);
  });
  assert.deepEqual(events, ['start:a', 'end:a', 'start:b', 'end:b']);
});
