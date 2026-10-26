import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const directory = mkdtempSync(join(tmpdir(), 'qq-everyone-'));
process.env.CFG_PATH = join(directory, 'config.yaml');
const { Format, getConfig } = await import('alemonjs');
const { createMarkdownText, markdownToText } = await import('../lib/format.js');
const { GROUP_AT_MESSAGE_CREATE, C2C_MESSAGE_CREATE, MESSAGE_CREATE } = await import('../lib/sends.js');
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
const client = { groupOpenMessages: record, channelsMessages: record, usersOpenMessages: record, postRichMediaByGroup: async () => ({ file_info: 'media' }) };
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
assert.equal(calls.at(-1).content, '<qqbot-at-everyone />公告', 'Group text messages must retain the everyone tag');
for (const value of ['everyone', 'all', undefined]) {
  await GROUP_AT_MESSAGE_CREATE(client, event, Format.create().addMention(value).addMarkdown(Format.createMarkdown().addText('公告')).value);
  assert.equal(calls.at(-1).markdown.content.trim(), '<qqbot-at-everyone />公告');
  await C2C_MESSAGE_CREATE(client, { UserId: 'u', MessageId: 'm' }, Format.create().addMention(value).addText('公告').value);
  assert.equal(calls.at(-1).content, '公告', 'C2C must not receive a group everyone tag');
}
await C2C_MESSAGE_CREATE(client, { UserId: 'u', MessageId: 'm' }, Format.create().addMarkdown(markdown).value);
assert.doesNotMatch(calls.at(-1).markdown.content, /qqbot-at-everyone/);
await GROUP_AT_MESSAGE_CREATE(client, event, Format.create().addMention('everyone').addText('公告').addImage('base64://eA==').value);
assert.equal(calls.at(-1).msg_type, 7);
assert.equal(calls.at(-1).content, '公告', 'The group everyone extension is limited to text and Markdown messages');
getConfig().dispose();
rmSync(directory, { recursive: true, force: true });
console.log('Verified group/channel everyone tags and C2C/media exclusions in plain/Markdown/mixed content, user tags, quoted Markdown and text fallback.');
process.exit(0);
