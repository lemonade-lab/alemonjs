import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { Router, shutdownLogger } from 'alemonjs';
import { createTestApp } from 'alemonjs/testing';

after(() => shutdownLogger());

const channelRules = { A: true, B: false };
const moduleRules = { A: false, B: true, C: true };

for (const [label, processor, moduleRule, expected] of [
  ['framework enables all', { channelMentionOnly: true, channelMentionOnlyByChannel: channelRules }, false, [[], [], []]],
  [
    'false framework setting leaves channel and module restrictions active',
    { channelMentionOnly: false, channelMentionOnlyByChannel: channelRules },
    true,
    [[], ['other'], ['other']]
  ],
  ['channel applies to all apps', { channelMentionOnlyByChannel: channelRules }, false, [[], ['other'], ['other']]],
  ['module applies to all its channels', {}, true, [['other'], ['other'], ['other']]],
  ['false module setting leaves module channel restrictions active', {}, false, [['restricted', 'other'], ['other'], ['other']]],
  ['module channel applies independently', {}, undefined, [['restricted', 'other'], ['other'], ['other']]]
]) {
  test(label, async t => {
    const app = createTestApp({
      config: { processor, apps: { restricted: { channelMentionOnly: moduleRule, channelMentionOnlyByChannel: moduleRules }, other: true } }
    });
    t.after(() => app.dispose());
    const calls = [];
    const starts = [];
    const finishes = [];
    for (const name of ['restricted', 'other']) {
      const router = Router.create({ events: ['message.create', 'private.message.create', 'interaction.create'] });
      router.res({}, () => (_event, next) => {
        calls.push(name);
        next();
      });
      await app.mount(
        {
          responseRouter: router.define
        },
        {
          onEventStart: () => {
            starts.push(name);
          },
          onEventFinished: () => {
            finishes.push(name);
          }
        },
        name
      );
    }
    const dispatch = async (event, wanted) => {
      calls.length = starts.length = finishes.length = 0;
      await app.clock.advance(1000);
      await app.dispatch(event);
      assert.deepEqual(calls, wanted);
      assert.deepEqual(starts, wanted);
      assert.deepEqual(finishes, wanted);
    };
    for (const [index, groupId] of ['A', 'B', 'C'].entries()) {
      await dispatch(app.events.groupMessage({ groupId }), expected[index]);
      await dispatch(app.events.groupMessage({ groupId }, { IsAtMe: true }), ['restricted', 'other']);
      await dispatch(app.events.channelMessage({ channelId: groupId }), expected[index]);
      await dispatch(app.events.channelMessage({ channelId: groupId }, { IsAtMe: true }), ['restricted', 'other']);
    }
    await dispatch(app.events.groupMessage({ groupId: 'A' }, { Target: undefined, SpaceId: 'A' }), expected[0]);
    await dispatch(app.events.groupMessage({ groupId: 'B' }, { Target: undefined }), expected[1]);
    await dispatch(app.events.channelMessage({ channelId: 'A' }, { Target: undefined, GuildId: 'different-guild' }), expected[0]);
    await dispatch(app.events.channelMessage({ channelId: 'A' }, { Target: undefined, OpenId: 'DIRECT:room' }), ['restricted', 'other']);
    await dispatch(app.events.privateMessage(), ['restricted', 'other']);
    await dispatch(app.events.interaction(), ['restricted', 'other']);
  });
}

test('late mention reaches only mention-gated apps, without a second sender quota charge', async t => {
  const app = createTestApp({ config: { apps: { restricted: { channelMentionOnly: true } } } });
  t.after(() => app.dispose());
  const calls = [];
  const starts = [];
  const finishes = [];
  for (const name of ['other', 'restricted']) {
    const router = Router.create({ events: ['message.create'] });
    router.res({}, () => (_event, next) => {
      calls.push(name);
      if (name === 'restricted') next();
    });
    await app.mount(
      { responseRouter: router.define },
      {
        onEventStart: () => {
          starts.push(name);
        },
        onEventFinished: () => {
          finishes.push(name);
        }
      },
      name
    );
  }

  const options = { platform: 'qq-bot', messageId: 'msg' };
  await app.dispatch(app.events.groupMessage(options));
  assert.deepEqual(calls, ['other']);
  await app.dispatch(app.events.groupMessage(options, { IsAtMe: true }));
  await app.dispatch(app.events.groupMessage(options, { IsAtMe: true }));
  assert.deepEqual(calls, ['other', 'restricted']);
  assert.deepEqual(starts, ['other', 'restricted']);
  assert.deepEqual(finishes, ['other', 'restricted']);
});

test('legacy disable filters stop both application lifecycle callbacks and routes', async t => {
  const app = createTestApp({
    config: {
      disabled_text_regular: '^blocked text$',
      disabled_selects: { 'interaction.create': true },
      disabled_user_id: ['blocked-id'],
      disabled_user_key: ['blocked-key']
    }
  });
  t.after(() => app.dispose());
  const calls = [];
  const router = Router.create({ events: ['message.create', 'interaction.create'] });
  router.res({}, () => () => {
    calls.push('route');
  });
  await app.mount(
    { responseRouter: router.define },
    {
      onEventStart: () => {
        calls.push('start');
      },
      onEventFinished: () => {
        calls.push('finish');
      }
    }
  );
  await app.dispatch(app.events.groupMessage({ text: 'blocked text' }));
  await app.dispatch(app.events.groupMessage({ userId: 'blocked-id' }));
  await app.dispatch(app.events.groupMessage({}, { UserKey: 'blocked-key' }));
  await app.dispatch(app.events.interaction());
  assert.deepEqual(calls, []);
  await app.dispatch(app.events.groupMessage());
  assert.deepEqual(calls, ['start', 'route', 'finish']);
});
