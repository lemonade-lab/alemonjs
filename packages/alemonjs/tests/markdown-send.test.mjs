import assert from 'node:assert/strict';
import test, { after, mock } from 'node:test';
import { mkdtempSync, rmSync, readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const directory = mkdtempSync(join(tmpdir(), 'alemonjs-markdown-send-'));
process.env.CFG_PATH = join(directory, 'config.yaml');
// 隔离核心入口自动注册的定时清理任务，发送路径使用离线客户端。
mock.timers.enable({ apis: ['setTimeout'] });
const { Format, getConfig, shutdownLogger } = await import('alemonjs');
const { sendToRoom } = await import('../../bubble/src/send.ts');
const { GROUP_AT_MESSAGE_CREATE, C2C_MESSAGE_CREATE, DIRECT_MESSAGE_CREATE, MESSAGE_CREATE } = await import('../../qq-bot/src/sends.ts');
after(async () => {
  mock.timers.reset();
  getConfig().dispose();
  await shutdownLogger();
  rmSync(directory, { recursive: true, force: true });
});

const format = () => Format.create().addText('BEFORE').addMarkdown(Format.createMarkdown().addBlockquote('QUOTE')).addText('AFTER').value;
const assertOrder = text => {
  assert.match(text, /^BEFORE\n+> QUOTE\n+AFTER$/);
};

test('Bubble transport receives text and quotes in source order', async () => {
  getConfig().saveValue({});
  const calls = [];
  await sendToRoom(
    {
      sendMessage: async (_, data) => {
        calls.push(data);
        return { id: '1' };
      }
    },
    { channel_id: '1' },
    format()
  );
  assert.equal(calls.length, 1);
  assertOrder(calls[0].content);
});

for (const [name, send] of Object.entries({ group: GROUP_AT_MESSAGE_CREATE, c2c: C2C_MESSAGE_CREATE, guild: DIRECT_MESSAGE_CREATE, channel: MESSAGE_CREATE })) {
  for (const plain of [false, true]) {
    test(`QQ ${name} ${plain ? 'fallback' : 'native'} transport preserves quote order`, async () => {
      getConfig().saveValue({ 'qq-bot': { markdownToText: plain } });
      const calls = [];
      const record = async (_, data) => {
        calls.push(data);
        return { id: '1' };
      };
      const client = { groupOpenMessages: record, usersOpenMessages: record, dmsMessages: record, channelsMessages: record };
      const result = await send(client, { ChannelId: '1', UserId: '2' }, format());
      assert.equal(calls.length, 1, JSON.stringify(result));
      assertOrder(plain ? calls[0].content : calls[0].markdown.content);
    });
  }
  test(`QQ ${name} fallback hides nested links and skips empty messages`, async () => {
    getConfig().saveValue({ 'qq-bot': { markdownToText: true, hideUnsupported: 3 } });
    const calls = [];
    const record = async (_, data) => {
      calls.push(data);
      return { id: '1' };
    };
    const client = { groupOpenMessages: record, usersOpenMessages: record, dmsMessages: record, channelsMessages: record };
    const hidden = Format.create().addMarkdown(Format.createMarkdown().addBlockquote(Format.createMarkdown().addLink('SECRET', 'https://example.com'))).value;
    await send(client, { ChannelId: '1', UserId: '2' }, hidden);
    assert.equal(calls.length, 0);
    await send(client, { ChannelId: '1', UserId: '2' }, [{ type: 'Text', value: 'KEEP' }, ...hidden]);
    assert.equal(calls[0].content, 'KEEP');
  });
}

test('QQ media fallback preserves quote boundaries and honors hiding', async () => {
  getConfig().saveValue({ 'qq-bot': { hideUnsupported: 3 } });
  const calls = [];
  const client = {
    postRichMediaByGroup: async () => ({ file_info: 'uploaded' }),
    groupOpenMessages: async (_, data) => {
      calls.push(data);
      return { id: '1' };
    }
  };
  const md = Format.createMarkdown().addBlockquote(Format.createMarkdown().addText('QUOTE').addLink('SECRET', 'https://example.com'));
  const value = Format.create().addText('BEFORE').addMarkdown(md).addText('AFTER').value;
  value.push({ type: 'Image', value: Buffer.from('image') });
  const result = await GROUP_AT_MESSAGE_CREATE(client, { ChannelId: '1' }, value);
  assert.equal(calls.length, 1, JSON.stringify(result));
  assertOrder(calls[0].content);
  assert.equal(calls[0].media.file_info, 'uploaded');
});

test('all adapter manifests require the core release containing the markdown entry', () => {
  const packages = new URL('../../', import.meta.url);
  const core = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const [major, minor, patch] = core.version.split('.').map(Number);
  assert.ok(major === 2 && (minor > 1 || (minor === 1 && patch >= 108)));
  for (const name of readdirSync(packages)) {
    if (name === 'alemonjs') continue;
    const manifest = JSON.parse(readFileSync(new URL(`${name}/package.json`, packages), 'utf8'));
    assert.equal(manifest.peerDependencies.alemonjs, '^2.1.108', name);
  }
  const fixture = join(directory, 'exports');
  const installed = join(fixture, 'node_modules', 'alemonjs');
  mkdirSync(installed, { recursive: true });
  const exports = core.exports['./markdown'];
  writeFileSync(join(installed, 'package.json'), JSON.stringify({ type: 'module', exports: { './markdown': exports } }));
  const target = join(installed, exports.import);
  mkdirSync(join(target, '..'), { recursive: true });
  writeFileSync(target, readFileSync(new URL('../lib/application/format/markdown-render.js', import.meta.url)));
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      "import {renderMarkdownBlockquote} from 'alemonjs/markdown'; if(typeof renderMarkdownBlockquote !== 'function') process.exit(1)"
    ],
    { cwd: fixture, encoding: 'utf8' }
  );
  assert.equal(result.status, 0, result.stderr);
});
