import assert from 'node:assert/strict';
import test from 'node:test';
import { Format } from '../src/application/format/message-format.ts';
import { Markdown } from '../src/application/format/message-format-old.ts';
import { renderMarkdownBlockquote, markdownToPlainText } from '../src/application/format/markdown-render.ts';
import { markdownToDiscordText, formatDiscordContent } from '../../discord/src/format.ts';
import { markdownToKMarkdown, formatKookContent } from '../../kook/src/format.ts';
import { markdownToTelegramText, formatTelegramContent } from '../../telegram/src/format.ts';
import { markdownToText as onebot } from '../../onebot/src/format.ts';
import { markdownToText as milky } from '../../milky/src/format.ts';
import { markdownToText as clawbot } from '../../wechat-clawbot/src/format.ts';
import { markdownToText as qqText, createMarkdownText } from '../../qq-bot/src/format.ts';
import { markdownToBubbleText, buildBubbleMdContent } from '../../bubble/src/format.ts';
import { dataToBridgeMessage } from '../../douyin/src/format.ts';
import { dataToDouyinContent } from '../../douyinbot/src/format.ts';
import { dataToWecomMessage } from '../../wecom/src/format.ts';
import { formatWechatText } from '../../wechat/src/format.ts';

const renderers = {
  discord: markdownToDiscordText,
  kook: markdownToKMarkdown,
  telegram: items => formatTelegramContent([{ type: 'Markdown', value: items }]),
  telegramHtml: markdownToTelegramText,
  wechat: items => formatWechatText([{ type: 'Markdown', value: items }]),
  onebot,
  milky,
  clawbot,
  qqText,
  qqNative: createMarkdownText,
  bubble: markdownToBubbleText,
  bubbleNative: items => buildBubbleMdContent([{ type: 'Markdown', value: items }]),
  douyin: items => dataToBridgeMessage([{ type: 'Markdown', value: items }]).text,
  douyinbot: items => dataToDouyinContent([{ type: 'Markdown', value: items }]).text.content,
  wecom: items => dataToWecomMessage([{ type: 'Markdown', value: items }]).markdown.content
};

test('keeps the legacy string payload and wrapper compatible', () => {
  const expected = { type: 'MD.blockquote', value: '**old**\n\ntext' };
  assert.deepEqual(Format.createMarkdown().addBlockquote(expected.value).value.value[0], expected);
  assert.deepEqual(Markdown.blockquote(expected.value), expected);
  assert.equal(renderMarkdownBlockquote(expected.value, markdownToPlainText), '\n\n> **old**\n>\n> text\n\n');
});

test('accepts builders and raw node arrays without sharing the caller array', () => {
  const inner = Format.createMarkdown().addText('inside');
  const outer = Format.createMarkdown().addBlockquote(inner);
  inner.addText('later');
  assert.deepEqual(outer.value.value[0].value, [{ type: 'MD.text', value: 'inside' }]);
  const nodes = [{ type: 'MD.text', value: 'raw' }];
  const raw = Format.createMarkdown().addBlockquote(nodes);
  nodes.push({ type: 'MD.text', value: 'later' });
  assert.equal(raw.value.value[0].value.length, 1);
  assert.deepEqual(Markdown.blockquote(inner).value, inner.value.value);
});

test('normalizes line endings and preserves blank lines including empty quotes', () => {
  assert.equal(renderMarkdownBlockquote('a\r\n\r\nb\rc', markdownToPlainText), '\n\n> a\n>\n> b\n> c\n\n');
  assert.equal(renderMarkdownBlockquote('', markdownToPlainText), '\n\n>\n\n');
  assert.equal(renderMarkdownBlockquote([], markdownToPlainText), '\n\n>\n\n');
  assert.equal(renderMarkdownBlockquote('\na\n', markdownToPlainText), '\n\n>\n> a\n>\n\n');
});

for (const [name, render] of Object.entries(renderers)) {
  test(`${name}: quote boundaries isolate surrounding text and preserve paragraphs`, () => {
    const md = Format.createMarkdown().addText('before').addBlockquote('first\n\nsecond').addText('after');
    const output = render(md.value.value);
    assert.match(output, /before *\n\n> first\n>\n> second\n\nafter/);
  });

  test(`${name}: nested quotes retain their content and nesting`, () => {
    const inner = Format.createMarkdown().addText('inside').addBlockquote('nested');
    const md = Format.createMarkdown().addText('before').addBlockquote(inner).addText('after');
    const output = render(md.value.value);
    assert.match(output, /> inside *\n>\n> > nested/);
    assert.match(output, /> > nested\n\nafter/);
    assert.doesNotMatch(output, /\[object Object\]/);
  });

  test(`${name}: adjacent quotes remain separate blocks`, () => {
    const md = Format.createMarkdown().addBlockquote('one').addBlockquote('two');
    assert.match(render(md.value.value), /> one\n{2,}> two/);
  });
}

test('structured quote content uses the target renderer and propagates hideUnsupported', () => {
  const md = Format.createMarkdown().addBlockquote(Format.createMarkdown().addBold('bold').addLink('link', 'https://example.com'));
  assert.match(markdownToDiscordText(md.value.value), /> \*\*bold\*\*\[link\]\(https:\/\/example.com\)/);
  assert.match(markdownToTelegramText(md.value.value), /<b>bold<\/b><a href="https:\/\/example.com">link<\/a>/);
  for (const render of [markdownToDiscordText, markdownToKMarkdown, markdownToTelegramText, onebot, qqText, markdownToBubbleText]) {
    assert.doesNotMatch(render(md.value.value, 3), /example.com|link/);
    assert.equal(render(md.value.value, 4), '');
  }
});

test('quoted code and list keep their markers inside the quote', () => {
  const inner = Format.createMarkdown().addList({ type: 'MD.listItem', value: 'item' }).addCode('line1\nline2', { language: 'ts' });
  const output = markdownToDiscordText(Format.createMarkdown().addBlockquote(inner).value.value);
  assert.equal(output, '\n\n> - item\n>\n> ```ts\n> line1\n> line2\n> ```\n\n');
});

for (const [name, render] of Object.entries(renderers)) {
  test(`${name}: every supported leaf survives inside a quote`, () => {
    const children = Format.createMarkdown()
      .addText('TEXT')
      .addContent('CONTENT')
      .addTitle('TITLE')
      .addSubtitle('SUBTITLE')
      .addBold('BOLD')
      .addItalic('ITALIC')
      .addItalicStar('STAR')
      .addStrikethrough('STRIKE')
      .addLink('LINK', 'https://example.com')
      .addLink('OPTIONAL_URL')
      .addImage('https://example.com/image.png')
      .addList('LIST', { index: 2, text: 'ORDERED' })
      .addDivider()
      .addNewline()
      .addCode('CODE')
      .addMention('USER123')
      .addButton('BUTTON', { data: '/command' });
    const content = render(Format.createMarkdown().addBlockquote(children).value.value);
    for (const text of [
      'TEXT',
      'CONTENT',
      'TITLE',
      'SUBTITLE',
      'BOLD',
      'ITALIC',
      'STAR',
      'STRIKE',
      'LINK',
      'OPTIONAL_URL',
      'LIST',
      'ORDERED',
      'CODE',
      'USER123',
      'BUTTON'
    ]) {
      assert.ok(content.includes(text), `${name} lost ${text}: ${content}`);
    }
    assert.doesNotMatch(content, /undefined|\[object Object\]/);
  });
}

test('list shorthand and legacy list items normalize into the same wire format', () => {
  const legacy = { type: 'MD.listItem', value: 'legacy' };
  const value = Format.createMarkdown().addList('simple', { index: 3, text: 'ordered' }, legacy).value.value[0].value;
  assert.deepEqual(value, [{ type: 'MD.listItem', value: 'simple' }, { type: 'MD.listItem', value: { index: 3, text: 'ordered' } }, legacy]);
  assert.deepEqual(Markdown.list('simple').value, [{ type: 'MD.listItem', value: 'simple' }]);
});

test('send and edit content converters preserve surrounding message segment order', () => {
  const format = Format.create().addText('BEFORE').addMarkdown(Format.createMarkdown().addBlockquote('QUOTE')).addText('AFTER').value;
  for (const content of [
    formatWechatText(format),
    formatTelegramContent(format),
    formatDiscordContent(format),
    formatKookContent(format),
    dataToWecomMessage(format).markdown.content
  ]) {
    assert.ok(content.indexOf('BEFORE') < content.indexOf('QUOTE'));
    assert.ok(content.indexOf('QUOTE') < content.indexOf('AFTER'));
    assert.doesNotMatch(content, /\[object Object\]/);
  }
});

test('Telegram sends readable quote content without generated HTML tags', () => {
  const md = Format.createMarkdown().addBlockquote(Format.createMarkdown().addBold('bold').addCode('a < b').addLink('docs', 'https://example.com'));
  const text = formatTelegramContent(Format.create().addMarkdown(md).value);
  assert.ok(text.includes('bold'));
  assert.ok(text.includes('a < b'));
  assert.ok(text.includes('docs (https://example.com)'));
  assert.doesNotMatch(text, /<b>|<pre>|<code|<a href/);
});

test('portable fallbacks propagate hiding levels into nested quote children', () => {
  const md = Format.createMarkdown().addBlockquote(
    Format.createMarkdown()
      .addText('KEEP')
      .addBlockquote(
        Format.createMarkdown().addLink('LINK', 'https://example.com').addButton('BUTTON', { data: '/command' }).addImage('https://example.com/image.png')
      )
  );
  const format = Format.create().addMarkdown(md).value;
  const targets = [
    level => formatTelegramContent(format, level),
    level => dataToBridgeMessage(format, level).text,
    level => dataToDouyinContent(format, level).text.content,
    level => dataToWecomMessage(format, level).markdown.content
  ];
  for (const render of targets) {
    assert.match(render(2), /KEEP/);
    assert.match(render(2), /https:\/\/example.com/);
    assert.match(render(2), /\/command/);
    assert.doesNotMatch(render(3), /LINK|BUTTON|command|example.com|图片/);
    assert.equal(render(4), '');
  }
});

test('QQ renders default everyone mentions correctly inside a quote', () => {
  const md = Format.createMarkdown().addBlockquote(Format.createMarkdown().addMention());
  assert.match(createMarkdownText(md.value.value), /<qqbot-at-everyone \/>/);
  assert.doesNotMatch(createMarkdownText(md.value.value), /id="everyone"/);
});

test('block nodes separate headings, prose and code inside quotes', () => {
  const children = Format.createMarkdown().addTitle('HEADING').addText('BODY').addCode('CODE').addText('AFTER');
  const md = Format.createMarkdown().addBlockquote(children);
  for (const render of Object.values(renderers)) {
    const text = render(md.value.value);
    assert.match(text, /HEADING[^\n]*\n>\n> BODY/);
    assert.match(text, /BODY[^\n]*\n>\n>/);
    assert.doesNotMatch(text, /HEADINGBODY|BODYCODE|CODEAFTER/);
  }
});

test('Discord headings after outer Text remain at the start of a line', () => {
  const format = Format.create().addText('BEFORE').addMarkdown(Format.createMarkdown().addTitle('HEADING').addText('BODY')).value;
  assert.equal(formatDiscordContent(format), 'BEFORE\n\n# HEADING\n\nBODY');
});

test('filtered quotes disappear recursively while explicit empty quotes survive', () => {
  const filtered = Format.createMarkdown().addBlockquote(Format.createMarkdown().addBlockquote(Format.createMarkdown().addLink('LINK', 'https://example.com')));
  for (const render of [markdownToPlainText, markdownToDiscordText, markdownToKMarkdown, markdownToTelegramText, onebot, qqText, markdownToBubbleText]) {
    assert.equal(render(filtered.value.value, 3), '');
    assert.equal(render(Format.createMarkdown().addBlockquote('').value.value, 3), '\n\n>\n\n');
  }
});

test('Discord original Markdown remains a separate document segment', () => {
  const format = Format.create().addText('BEFORE').addMarkdownOriginal('# HEADING').addText('AFTER').value;
  assert.equal(formatDiscordContent(format), 'BEFORE\n\n# HEADING\n\nAFTER');
});
