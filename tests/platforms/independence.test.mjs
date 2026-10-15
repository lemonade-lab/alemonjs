import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const platforms = JSON.parse(await readFile(new URL('../../scripts/social-platforms.json', import.meta.url), 'utf8'));

for (const name of platforms) {
  test(`${name}: owns its framework connection and cleans up independently`, async t => {
    const directory = new URL(`../../packages/${name}/`, import.meta.url);
    const manifest = JSON.parse(await readFile(new URL('package.json', directory), 'utf8'));
    // Each published package must work with its SDK and the existing framework alone.
    for (const dependency of Object.keys(manifest.dependencies ?? {})) {
      assert.ok(!dependency.startsWith('@alemonjs/'), `${name} must not depend on another adapter package`);
    }
    for (const file of await readdir(new URL('src/', directory))) {
      const source = await readFile(new URL(`src/${file}`, directory), 'utf8');
      assert.doesNotMatch(source, /(?:from|import)\s*['"](?:@alemonjs\/|\.\.\/\.\.\/)/);
    }
    const entry = await import(new URL('src/index.ts', directory));
    const startName = 'start' + name.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('');
    const events = [];
    let action;
    let api;
    let stops = 0;
    const before = ['SIGINT', 'SIGTERM', 'disconnect'].map(signal => process.listenerCount(signal));
    const runtime = await entry[startName]({}, {
      send: event => events.push(event),
      onactions: handler => { action = handler; },
      onapis: handler => { api = handler; }
    }, context => ({
      client: { echo: value => value },
      actions: { 'message.send.user': payload => ({ id: payload.UserId }) },
      start: () => {
        context.ready('bot');
        context.emit({ user: 'user', id: 'message', private: true, text: 'hello' });
      },
      stop: async () => { stops++; }
    }));
    t.after(runtime.stop);
    assert.equal(events[0].Platform, name);
    assert.equal(events[1].Platform, name);
    assert.equal(events[1].name, 'private.message.create');
    assert.equal(events[1].MessageText, 'hello');
    const result = await new Promise(resolve => action({ action: 'message.send.user', payload: { UserId: 'target' } }, resolve));
    assert.equal(result[0].data.id, 'target');
    const native = await new Promise(resolve => api({ payload: { key: 'echo', params: ['value'] } }, resolve));
    assert.equal(native[0].data, 'value');
    await runtime.stop();
    await runtime.stop();
    assert.equal(stops, 1);
    assert.deepEqual(['SIGINT', 'SIGTERM', 'disconnect'].map(signal => process.listenerCount(signal)), before);
  });
}
