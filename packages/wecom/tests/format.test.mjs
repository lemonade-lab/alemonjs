import assert from 'node:assert/strict';
import test from 'node:test';
import { dataToWecomMessage, toWecomProactiveMessage } from '../lib/format.js';

test('prefers native markdown when framework markdown is supplied', () => {
  assert.deepEqual(dataToWecomMessage([{ type: 'MarkdownOriginal', value: '# 标题' }]), {
    msgtype: 'markdown',
    markdown: { content: '# 标题' }
  });
});

test('serializes text and mentions as a text message', () => {
  assert.deepEqual(
    dataToWecomMessage([
      { type: 'Text', value: '你好 ' },
      { type: 'Mention', value: 'alice' }
    ]),
    {
      msgtype: 'text',
      text: { content: '你好 @alice' }
    }
  );
});

test('converts proactive text sends to Markdown as required by the WeCom API', () => {
  assert.deepEqual(toWecomProactiveMessage(dataToWecomMessage([{ type: 'Text', value: '通知' }])), {
    msgtype: 'markdown',
    markdown: { content: '通知' }
  });
});
