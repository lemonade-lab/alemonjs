import assert from 'node:assert/strict';
import test from 'node:test';
import { dataToBridgeMessage } from '../lib/format.js';
import { parseGateway } from '../lib/gateway.js';

test('serializes text and link to bridge message', () => {
  assert.deepEqual(
    dataToBridgeMessage([
      { type: 'Text', value: '你好' },
      { type: 'Link', value: '文档', options: { link: 'https://example.com' } }
    ]).text,
    '你好文档 (https://example.com)'
  );
});

test('hides unsupported segments when requested', () => {
  assert.equal(dataToBridgeMessage([{ type: 'Embed', value: 'ignored' }], true).text, '');
});

test('keeps media instructions for the bridge without forcing a text placeholder', () => {
  assert.deepEqual(dataToBridgeMessage([{ type: 'ImageURL', value: 'https://example.com/image.png' }]), {
    text: '',
    segments: [{ type: 'image', url: 'https://example.com/image.png' }]
  });
});

test('preserves the user ID for a native mention when it is available', () => {
  assert.deepEqual(dataToBridgeMessage([{ type: 'Mention', value: '小明', options: { payload: { UserId: '123456' } } }]), {
    text: '@小明',
    segments: [{ type: 'mention', text: '@小明', user_id: '123456' }]
  });
});

test('only permits authenticated encrypted remote gateways', () => {
  assert.throws(() => parseGateway('ws://bridge.example.com', 'secret'), /wss/);
  assert.throws(() => parseGateway('wss://bridge.example.com'), /token/);
  assert.throws(() => parseGateway('wss://user:secret@bridge.example.com', 'secret'), /URL/);
  assert.equal(parseGateway('wss://bridge.example.com', 'secret').protocol, 'wss:');
  assert.equal(parseGateway('ws://127.0.0.1:17880').hostname, '127.0.0.1');
});
