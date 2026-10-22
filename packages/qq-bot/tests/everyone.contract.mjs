import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const directory = mkdtempSync(join(tmpdir(), 'qq-everyone-'));
process.env.CFG_PATH = join(directory, 'config.yaml');
const { Format, getConfig } = await import('alemonjs');
const { createMarkdownText, markdownToText } = await import('../lib/format.js');
const { GROUP_AT_MESSAGE_CREATE, MESSAGE_CREATE } = await import('../lib/sends.js');
const markdown = Format.createMarkdown().addMention('everyone').addText('公告');
assert.equal(createMarkdownText(markdown.value.value).trim(), '<qqbot-at-everyone />公告');
assert.equal(markdownToText(markdown.value.value).trim(), '@全体成员公告');
const quote = Format.createMarkdown().addBlockquote(markdown);
assert.match(createMarkdownText(quote.value.value), /> <qqbot-at-everyone \/>公告/);
const calls = [];
const record = async (_id, data) => {
  calls.push(data);
  return { id: 'sent' };
};
const client = { groupOpenMessages: record, channelsMessages: record };
const event = { ChannelId: 'c', MessageId: 'm' };
getConfig().saveValue({});
const native = await MESSAGE_CREATE(client, event, Format.create().addMarkdown(markdown).value);
assert.equal(native[0].code, 2000);
assert.equal(calls.at(-1).markdown.content.trim(), '<qqbot-at-everyone />公告');
for (const value of ['everyone', 'all', undefined]) {
  await MESSAGE_CREATE(client, event, Format.create().addMention(value).addText('公告').value);
  assert.equal(calls.at(-1).content, '<qqbot-at-everyone />公告');
  await MESSAGE_CREATE(client, event, Format.create().addMention(value).addMarkdown(Format.createMarkdown().addText('公告')).value);
  assert.equal(calls.at(-1).markdown.content.trim(), '<qqbot-at-everyone />公告');
}
for (const send of [GROUP_AT_MESSAGE_CREATE, MESSAGE_CREATE]) {
  await send(client, event, Format.create().addMention('u', { belong: 'user' }).addText('通知').value);
  assert.equal(calls.at(-1).content, '<qqbot-at-user id="u" />通知');
}
getConfig().saveValue({ 'qq-bot': { markdownToText: true } });
await MESSAGE_CREATE(client, event, Format.create().addMarkdown(markdown).value);
assert.equal(calls.at(-1).content.trim(), '@全体成员公告');
assert.equal(calls.at(-1).markdown, undefined);
getConfig().saveValue({});
await GROUP_AT_MESSAGE_CREATE(client, { ChannelId: 'g', MessageId: 'm' }, Format.create().addMention('everyone').addText('公告').value);
assert.equal(calls.at(-1).content, '公告', 'Plain group messages must not receive a Markdown tag');
getConfig().dispose();
rmSync(directory, { recursive: true, force: true });
console.log('Verified channel everyone tags in plain/Markdown/mixed content, user tags, quoted Markdown and text fallback.');
process.exit(0);
