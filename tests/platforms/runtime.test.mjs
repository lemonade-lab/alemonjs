import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import {
  destination,
  callNative,
  bytes,
  messageId,
  safeError,
  withMedia,
  isContextTarget
} from '../../packages/slack/src/utils.ts';
import { RestClient, equal, hmac } from '../../packages/whatsapp/src/utils.ts';
import { publicValue, standardResult } from '../../packages/slack/src/results.ts';
import { standardResult as googleResult } from '../../packages/google-chat/src/results.ts';
import { startSlack } from '../../packages/slack/src/index.ts';

test('resolves private replies, channel replies and explicit direct targets', () => {
  assert.deepEqual(destination({ event: { IsPrivate: true, UserId: 'u', OpenId: 'session' } }), {
    id: 'session',
    private: true,
    bot: undefined,
    scope: 'c2c'
  });
  assert.equal(destination({ event: { IsPrivate: false, ChannelId: 'c', UserId: 'u' } }).id, 'c');
  assert.equal(destination({ target: { scope: 'direct', targetId: 'dm' } }).scope, 'direct');
  assert.throws(() => destination({ target: { scope: 'invalid', targetId: 'x' } }), /Invalid/);
  assert.throws(() => destination({}), /Missing/);
});

test('native method traversal preserves owner and rejects prototype paths', async () => {
  const client = {
    chat: {
      id: 'owner',
      async send(x) {
        return this.id + x;
      }
    }
  };
  assert.equal(await callNative(client, 'chat.send', ['!']), 'owner!');
  for (const key of ['__proto__.send', 'chat.constructor', 'chat._secret', 'chat.missing']) await assert.rejects(callNative(client, key));
});

test('HTTP transport surfaces application errors and prevents credential redirects', async t => {
  const server = createServer((req, res) => {
    if (req.url === '/api/redirect') {
      res.writeHead(302, { Location: '/outside' });
      res.end();
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(req.url === '/api/error' ? { errcode: 40013, errmsg: 'denied' } : { id: 'ok' }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const client = new RestClient(`http://127.0.0.1:${server.address().port}/api/`, { Authorization: 'secret' });
  assert.equal((await client.request('ok')).id, 'ok');
  await assert.rejects(client.request('error'), /denied/);
  await assert.rejects(client.request('redirect'));
  await assert.rejects(client.request('https://other.example/'), /base URL/);
  await assert.rejects(client.request('../outside'), /base URL/);
});

test('media and message acknowledgements enforce real boundaries', async () => {
  assert.equal((await bytes('base64://aGVsbG8=')).toString(), 'hello');
  await assert.rejects(bytes('base64://aGVsbG8=', 2), /limit/);
  await assert.rejects(bytes('/etc/passwd'), /Media must/);
  assert.throws(() => messageId({ ok: true }, undefined), /missing/);
  assert.equal(messageId({}, '9007199254740993').id, '9007199254740993');
  assert.equal(equal('a', 'bb'), false);
  assert.equal(equal(hmac('s', Buffer.from('a')), hmac('s', Buffer.from('b'))), false);
  assert.equal(safeError(new Error('token=secret-value'), { access_token: 'secret-value' }), 'token=[redacted]');
});

test('runtime emits typed events, deduplicates and fails unknown or rejected actions', async t => {
  const events = [];
  let onAction;
  let onApi;
  let stops = 0;
  const transport = {
    send: e => events.push(e),
    onactions: cb => {
      onAction = cb;
    },
    onapis: cb => {
      onApi = cb;
    }
  };
  const runtime = await startSlack(
    {},
    transport,
    () => ({
      client: { echo: x => x },
      actions: {
        bad: () => false,
        good: () => ({ id: 'm' }),
        secret: () => {
          throw new Error('failure');
        }
      },
      stop: () => {
        stops++;
      }
    }),
    transport
  );
  t.after(runtime.stop);
  runtime.context.ready('bot');
  runtime.context.emit({ user: 'u', id: 'm', private: true, channel: 'dm', text: 'hi', raw: { safe: true } });
  runtime.context.emit({ user: 'u', id: 'm', private: true, channel: 'dm', text: 'hi' });
  runtime.context.emit({ name: 'reaction.add', user: 'u', id: 'r', channel: 'c', interaction: 'heart' });
  runtime.context.emit({ name: 'interaction.create', user: 'u', id: 'i', private: true, interaction: { data: 'ok' } });
  assert.equal(events.length, 4);
  assert.equal(events[1].name, 'private.message.create');
  assert.equal(events[1].ChannelId, 'dm');
  assert.equal(events[2].name, 'message.reaction.add');
  assert.equal(events[3].name, 'private.interaction.create');
  const action = name => new Promise(resolve => onAction({ action: name, payload: {} }, r => resolve(r[0])));
  assert.equal((await action('good')).data.id, 'm');
  assert.notEqual((await action('bad')).code, (await action('good')).code);
  assert.notEqual((await action('unknown')).code, (await action('good')).code);
  assert.deepEqual((await action('connection.status')).data.capabilities, ['bad', 'good', 'secret']);
  const api = await new Promise(resolve => onApi({ payload: { key: 'echo', params: ['value'] } }, resolve));
  assert.equal(api[0].data, 'value');
  await runtime.stop();
  await runtime.stop();
  assert.equal(stops, 1);
});

test('normalizes SDK profile and pagination into framework hook results', () => {
  const user = standardResult('user.info', {
    user: { id: 'U123', real_name: 'Ada', profile: { image_192: 'https://example.com/a.png' } }
  });
  assert.equal(user.UserId, 'U123');
  assert.equal(user.UserName, 'Ada');
  assert.ok(user.UserKey);
  const members = standardResult('member.list', { members: ['U123'], response_metadata: { next_cursor: 'next' } });
  assert.equal(members.Items[0].UserId, 'U123');
  assert.equal(members.NextCursor, 'next');
  const spaces = googleResult('channel.list', { spaces: [{ name: 'spaces/123', displayName: 'Room' }] });
  assert.equal(spaces[0].ChannelId, 'spaces/123');
  assert.equal(spaces[0].ChannelName, 'Room');
});

test('framework media/file actions preserve scope, filename and media source', async () => {
  let received;
  const actions = withMedia({
    'message.send.user': p => {
      received = p;
      return { id: 'sent' };
    }
  });
  await actions['file.send.user']({ UserId: 'U', params: { file: 'base64://aGVsbG8=', name: 'hello.txt' } });
  assert.equal(received.UserId, 'U');
  assert.deepEqual(received.params.format[0], { type: 'Attachment', value: 'base64://aGVsbG8=', options: { filename: 'hello.txt' } });
  assert.throws(() => actions['media.send.user']({ UserId: 'U', params: { type: 'image', fileId: 'opaque' } }), /native send API/);
});

test('reply credentials cannot follow a target override to another user', () => {
  const p = { event: { UserId: 'u1', IsPrivate: true, Target: { scope: 'direct', targetId: 'dm1' } } };
  assert.equal(isContextTarget(p, { id: 'dm1', private: true, scope: 'direct' }), true);
  assert.equal(isContextTarget(p, { id: 'u2', private: true, scope: 'c2c' }), false);
  assert.equal(isContextTarget(p, { id: 'dm2', private: true, scope: 'direct' }), false);
});

test('SDK response serialization omits private HTTP clients and preserves raw data', () => {
  const symbol = Symbol('twurpleRawData');
  const native = { [symbol]: { id: '123', display_name: 'Ada' }, _client: { token: 'secret' } };
  assert.deepEqual(publicValue(native), { id: '123', display_name: 'Ada' });
  assert.deepEqual(publicValue({ data: [{ id: '1', _client: { token: 'secret' } }] }), { data: [{ id: '1' }] });
});

test('concurrent shutdown callers wait for the same cleanup and block further actions', async () => {
  let handler;
  let finish;
  const cleanup = new Promise(resolve => {
    finish = resolve;
  });
  const runtime = await startSlack({}, {
    send() {},
    onapis() {},
    onactions(cb) {
      handler = cb;
    }
  }, () => ({ client: {}, actions: { send: () => 'bad' }, stop: () => cleanup }));
  const first = runtime.stop();
  const second = runtime.stop();
  assert.equal(first, second);
  const response = await new Promise(resolve => handler({ action: 'send', payload: {} }, resolve));
  assert.match(response[0].message, /stopped/);
  finish();
  await first;
});
