import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const directory = mkdtempSync(join(tmpdir(), 'qq-md-buttons-'));
process.env.CFG_PATH = join(directory, 'config.yaml');
const { Format, getConfig } = await import('alemonjs');
const { createMarkdownText } = await import('../lib/format.js');
const { GROUP_AT_MESSAGE_CREATE, C2C_MESSAGE_CREATE, MESSAGE_CREATE, DIRECT_MESSAGE_CREATE } = await import('../lib/sends.js');
getConfig().saveValue({});
const button = Format.createMarkdown().addButton('领取奖励', { data: '/reward', autoEnter: true });
const quote = Format.createMarkdown().addBlockquote(Format.createMarkdown().addBlockquote(button));
assert.equal(createMarkdownText(button.value.value, 'c2c'), '<qqbot-cmd-enter text="/reward" />');
assert.equal(createMarkdownText(button.value.value), '<qqbot-cmd-input text="/reward" show="领取奖励" />');
assert.match(createMarkdownText(quote.value.value, 'c2c'), /qqbot-cmd-enter text="\/reward" \/>/);
const calls = [];
const record = kind => async (_id, body) => {
  const content = body.markdown?.content ?? '';
  // 模拟平台拒绝本次报告的两种非法请求。
  if (kind !== 'c2c') assert.doesNotMatch(content, /qqbot-cmd-enter/);
  for (const tag of content.matchAll(/<qqbot-cmd-enter\b([^>]+)\/>/g)) {
    assert.match(tag[1], /^ text="[^"]*" $/);
  }
  calls.push({ kind, body });
  return { id: 'sent' };
};
const client = {
  groupOpenMessages: record('group'),
  usersOpenMessages: record('c2c'),
  channelsMessages: record('guild'),
  dmsMessages: record('guild-direct')
};
const event = { ChannelId: 'group', UserId: 'user', MessageId: 'message' };
for (const [send, kind] of [
  [GROUP_AT_MESSAGE_CREATE, 'group'],
  [C2C_MESSAGE_CREATE, 'c2c'],
  [MESSAGE_CREATE, 'guild'],
  [DIRECT_MESSAGE_CREATE, 'guild-direct']
]) {
  for (const md of [button, quote]) {
    const result = await send(client, event, Format.create().addText('前文').addMarkdown(md).addText('后文').value);
    assert.equal(result[0].code, 2000, JSON.stringify(result));
    const { body } = calls.at(-1);
    assert.equal(calls.at(-1).kind, kind);
    assert.match(body.markdown.content, /前文/);
    assert.match(body.markdown.content, /后文/);
    assert.match(body.markdown.content, kind === 'c2c' ? /<qqbot-cmd-enter text="\/reward" \/>/ : /<qqbot-cmd-input text="\/reward" show="领取奖励" \/>/);
  }
  const input = Format.createMarkdown().addButton('填入', { data: '/input', autoEnter: false });
  await send(client, event, Format.create().addMarkdown(input).value);
  assert.equal(calls.at(-1).body.markdown.content, '<qqbot-cmd-input text="/input" show="填入" />');
}
const escaped = Format.createMarkdown().addButton('标题"<&', { data: '/say "a" <b>&', autoEnter: true });
assert.equal(createMarkdownText(escaped.value.value, 'c2c'), '<qqbot-cmd-enter text="/say &quot;a&quot; &lt;b&gt;&amp;" />');
assert.equal(createMarkdownText(escaped.value.value, 'group'), '<qqbot-cmd-input text="/say &quot;a&quot; &lt;b&gt;&amp;" show="标题&quot;&lt;&amp;" />');
// input 的 80 字符边界、中文、转义及 emoji；enter 不受 input 截断规则影响。
for (const [text, expected] of [
  ['a'.repeat(79), 'a'.repeat(79)],
  ['a'.repeat(80), 'a'.repeat(80)],
  ['a'.repeat(81), 'a'.repeat(80)],
  ['中'.repeat(101), '中'.repeat(80)],
  ['a'.repeat(79) + '😀尾部', 'a'.repeat(79)],
  ['a'.repeat(78) + '😀尾部', 'a'.repeat(78) + '😀'],
  ['a'.repeat(79) + '&尾部', 'a'.repeat(79) + '&amp;']
]) {
  const longButton = Format.createMarkdown().addButton('长指令', { data: text, autoEnter: true });
  for (const context of ['group', 'guild']) {
    assert.equal(createMarkdownText(longButton.value.value, context), `<qqbot-cmd-input text="${expected}" show="长指令" />`);
  }
  const manualInput = Format.createMarkdown().addButton('长指令', { data: text });
  assert.equal(createMarkdownText(manualInput.value.value, 'c2c'), `<qqbot-cmd-input text="${expected}" show="长指令" />`);
  assert.equal(createMarkdownText(longButton.value.value, 'c2c'), `<qqbot-cmd-enter text="${text.replace(/&/g, '&amp;')}" />`);
  await GROUP_AT_MESSAGE_CREATE(client, event, Format.create().addMarkdown(Format.createMarkdown().addBlockquote(longButton)).value);
  assert.ok(calls.at(-1).body.markdown.content.includes(`text="${expected}"`));
}
const missingData = Format.createMarkdown().addButton('/help', { autoEnter: true });
assert.equal(createMarkdownText(missingData.value.value, 'c2c'), '<qqbot-cmd-enter text="/help" />');
// 键盘 action.enter 是独立能力，群聊仍保留自动发送。
await GROUP_AT_MESSAGE_CREATE(
  client,
  event,
  Format.create()
    .addMarkdown(Format.createMarkdown().addText('选择'))
    .addButtonGroup(Format.createButtonGroup().addButton('领取', '/reward', { autoEnter: true })).value
);
assert.equal(calls.at(-1).body.keyboard.content.rows[0].buttons[0].action.enter, true);
getConfig().saveValue({ 'qq-bot': { markdownToText: true } });
await C2C_MESSAGE_CREATE(client, event, Format.create().addMarkdown(quote).value);
assert.doesNotMatch(calls.at(-1).body.content, /qqbot-cmd/);
assert.match(calls.at(-1).body.content, /领取奖励/);
getConfig().dispose();
rmSync(directory, { recursive: true, force: true });
console.log(
  'Verified C2C-only enter with text-only attributes, group/channel input fallback, nested quotes, mixed text, escaping, keyboard compatibility and plain fallback.'
);
process.exit(0);
