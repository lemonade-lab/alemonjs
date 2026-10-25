import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const directory = mkdtempSync(join(tmpdir(), 'qq-markdown-extension-'));
process.env.CFG_PATH = join(directory, 'config.yaml');
const { Format, getConfig } = await import('alemonjs');
const { QQMarkdown } = await import('@alemonjs/qq-bot/markdown');
const { GROUP_AT_MESSAGE_CREATE, C2C_MESSAGE_CREATE, MESSAGE_CREATE, DIRECT_MESSAGE_CREATE } = await import('../lib/sends.js');
// 通用构建器和节点协议不引入 QQ 扩展方法或元数据。
for (const method of ['addMath', 'addTaskList', 'addUnderline', 'addColor', 'addRuby', 'addBoxed', 'addCancel']) {
  assert.equal(Format.createMarkdown()[method], undefined, method);
}
assert.equal(QQMarkdown.math(String.raw`\frac{a}{b}`), String.raw`$\frac{a}{b}$`);
assert.equal(QQMarkdown.math('x^2', { block: true }), '\n\n$$\nx^2\n$$\n\n');
assert.equal(QQMarkdown.taskList(), '');
assert.equal(QQMarkdown.taskList({ text: '完成', checked: true }, { text: '未\r\n完成' }), '\n\n- [x] 完成\n- [ ] 未 完成\n\n');
assert.equal(QQMarkdown.underline('下划线'), String.raw`$\underline{\text{下划线}}$`);
assert.equal(QQMarkdown.color('红色', 'red'), String.raw`$\color{red}{\text{红色}}$`);
assert.equal(QQMarkdown.ruby('汉', 'hàn'), String.raw`$\overset{\text{hàn}}{\text{汉}}$`);
assert.equal(QQMarkdown.boxed('重点'), String.raw`$\boxed{\text{重点}}$`);
assert.equal(QQMarkdown.cancel('划除'), String.raw`$\cancel{\text{划除}}$`);
assert.equal(
  QQMarkdown.underline('a_b{c} $5 & # % \\ ^ ~\r\n结束'),
  String.raw`$\underline{\text{a\_b\{c\} \$5 \& \# \% \textbackslash{} \textasciicircum{} \textasciitilde{} 结束}}$`
);
assert.throws(() => QQMarkdown.color('内容', 'red}{bad'), TypeError);
getConfig().saveValue({});
const bodies = [];
const record = async (_id, body) => {
  bodies.push(JSON.parse(JSON.stringify(body)));
  return { id: 'sent' };
};
const client = { groupOpenMessages: record, usersOpenMessages: record, channelsMessages: record, dmsMessages: record };
const event = { ChannelId: 'group', UserId: 'user', MessageId: 'message' };
const inner = Format.createMarkdown()
  .addContent(QQMarkdown.taskList({ text: '已完成', checked: true }, { text: '待完成' }))
  .addContent(QQMarkdown.math(String.raw`\frac{a}{b}`, { block: true }))
  .addContent(QQMarkdown.color('提示', 'red'))
  .addContent(QQMarkdown.ruby('汉', 'hàn'));
assert.ok(inner.value.value.every(node => node.type === 'MD.content' && typeof node.value === 'string' && node.options === undefined));
const format = Format.create().addText('前文').addMarkdown(Format.createMarkdown().addBlockquote(inner)).addText('后文');
for (const send of [GROUP_AT_MESSAGE_CREATE, C2C_MESSAGE_CREATE, MESSAGE_CREATE, DIRECT_MESSAGE_CREATE]) {
  const result = await send(client, event, format.value);
  assert.equal(result[0].code, 2000);
  const body = bodies.at(-1);
  assert.match(body.markdown.content, /前文/);
  assert.match(body.markdown.content, /> - \[x\] 已完成\n> - \[ \] 待完成/);
  assert.match(body.markdown.content, /> \$\$\n> \\frac\{a\}\{b\}\n> \$\$/);
  assert.match(body.markdown.content, /\$\\color\{red\}\{\\text\{提示\}\}\$/);
  assert.match(body.markdown.content, /后文/);
}
await GROUP_AT_MESSAGE_CREATE(client, event, Format.create().addMarkdownOriginal(QQMarkdown.math('E = mc^2')).value);
assert.equal(bodies.at(-1).markdown.content.trim(), '$E = mc^2$');
getConfig().dispose();
rmSync(directory, { recursive: true, force: true });
console.log('Verified QQ-only extension entry, unchanged generic builder, text escaping and native sends through existing raw Markdown paths.');
process.exit(0);
