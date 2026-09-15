import assert from 'node:assert/strict';
import test from 'node:test';
import { dataToDouyinContent } from '../lib/format.js';

test('serializes portable framework segments as a text IM payload', () => {
  assert.deepEqual(
    dataToDouyinContent([
      { type: 'Text', value: '你好' },
      { type: 'Link', value: '文档', options: { link: 'https://example.com' } }
    ]),
    {
      msg_type: 1,
      text: { content: '你好文档 (https://example.com)' }
    }
  );
});

test('omits unsupported segments when requested', () => {
  assert.equal(dataToDouyinContent([{ type: 'Attachment', value: 'ignored' }], true).text.content, '');
});
