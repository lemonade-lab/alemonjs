import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const folder = mkdtempSync(join(tmpdir(), 'qq-changelog-'));
process.env.CFG_PATH = join(folder, 'config.yaml');
const { QQBotAPI } = await import('../lib/sdk/api.js');
const { handleFrameworkAction } = await import('../lib/framework-actions.js');
const { getConfig } = await import('alemonjs');
const client = new QQBotAPI({ app_id: 'test' });
const calls = [];
let stored;
client.groupService = async request => {
  calls.push(request);
  if (request.method === 'post' && request.url === '/v2/panels') {
    stored = { ...request.data, panel_id: 'p' };
    return { panel_id: 'p' };
  }
  if (request.method === 'get' && request.url === '/v2/panels') {
    return { records: [{ ...stored, scope: request.params.scope }], next_cursor: '', is_end: true };
  }
  if (request.method === 'get' && request.url === '/v2/panels/p') return stored;
  return { version: 2 };
};
const call = async (action, params) => (await handleFrameworkAction(client, { action, payload: { params } }, 'test'))[0];
const ok = async (action, params) => {
  const result = await call(action, params);
  assert.equal(result.code, 2000, JSON.stringify(result));
  return result.data;
};
const rejected = async (action, params) => {
  const before = calls.length;
  assert.notEqual((await call(action, params)).code, 2000);
  assert.equal(calls.length, before, 'Invalid requests must fail before HTTP');
};
// 官方菜单上限：一级名称 10，二级名称 14；中文占 2。
for (const name of ['一二三四五', 'a一二三四b', 'abcdefghij']) {
  await ok('menu.set', { menu: { items: [{ name, type: 'message', text: '/help' }] } });
  assert.equal(calls.at(-1).data.menu.items[0].name, name);
}
for (const name of ['一二三四五六', 'a一二三四五', 'abcdefghijk']) {
  await rejected('menu.set', { menu: { items: [{ name, type: 'message', text: '/help' }] } });
}
await ok('menu.set', { menu: { items: [{ name: '更多', type: 'menu', items: [{ name: '一二三四五六七', type: 'message', text: '/help' }] }] } });
await rejected('menu.set', { menu: { items: [{ name: '更多', type: 'menu', items: [{ name: '一二三四五六七八', type: 'message', text: '/help' }] }] } });
const panel = { items: [{ name: '一二三四五六七', description: '中'.repeat(15), type: 'command' }], remark: 'a'.repeat(255) };
for (const [scope, wireScope] of [
  ['group', 'group'],
  ['c2c', 'c2c'],
  ['channel', 'channel'],
  ['direct', 'dm']
]) {
  await ok('panel.create', { scope, panel });
  assert.equal(calls.at(-1).data.scope, wireScope);
  assert.equal(calls.at(-1).data.target_type, 'all');
  assert.deepEqual(calls.at(-1).data.panel.items[0], {
    name: panel.items[0].name,
    desc: panel.items[0].description,
    type: 'command',
    only_admin: undefined,
    link: undefined
  });
  assert.equal((await ok('panel.get', { id: 'p' })).scope, scope);
  assert.equal((await ok('panel.list', { scope })).Items[0].scope, scope);
  assert.equal(calls.at(-1).params.scope, wireScope);
}
for (const scope of ['channel', 'direct']) {
  for (const audience of [{ audience: 'specific' }, { userIds: ['u'] }, { guildIds: ['g'] }]) {
    await rejected('panel.create', { scope, panel, ...audience });
  }
}
await rejected('panel.list', { scope: 'dm' });
await rejected('panel.create', { scope: 'group', audience: 'invalid', panel });
await rejected('panel.create', { scope: 'group', panel: { items: [{ name: '中'.repeat(8), type: 'command' }] } });
await rejected('panel.update', { id: 'p', panel: { items: [{ name: '帮助', description: '中'.repeat(16), type: 'command' }] } });
await rejected('panel.update', { id: 'p', panel: { items: [], remark: 'a'.repeat(256) } });
await ok('panel.update', { id: 'p', panel: { items: [], remark: '中'.repeat(255) } });
await rejected('panel.update', { id: 'p', panel: { items: [], remark: '中'.repeat(256) } });
// 已有 targeted group/c2c 逻辑必须保持。
await ok('panel.create', { scope: 'group', audience: 'specific', guildIds: ['g'], panel });
assert.deepEqual(calls.at(-1).data.group_openids, ['g']);
await ok('panel.create', { scope: 'c2c', audience: 'specific', userIds: ['u'], panel });
assert.deepEqual(calls.at(-1).data.user_openids, ['u']);
getConfig().dispose();
rmSync(folder, { recursive: true, force: true });
console.log('Verified four panel scopes, direct/dm mapping, global-only channel audiences and Chinese/mixed/ASCII length boundaries.');
process.exit(0);
