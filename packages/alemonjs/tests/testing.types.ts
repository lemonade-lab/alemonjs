import { createTestApp, type TestRunResult } from 'alemonjs/testing';
import { useMessage, onResponse, Router, createResult, ResultCode } from 'alemonjs';

const app = createTestApp({ config: { processor: { repeated_user_time: 0 } } });
const event = app.events.groupMessage({ userId: '001', groupId: 'group' });
const handler = onResponse('message.create', async () => {
  await useMessage()[0].send({ content: { text: 'hello' } });
});
app.actions.on('message.send', () => [createResult(ResultCode.Fail, 'denied', null)]);
const result: Promise<TestRunResult> = app.runHandler(handler, event);
void result;
void app.runHandler(onResponse('message.create', [() => true, () => {}]), event);
const router = Router.create({ events: ['message.create'] });
router.use('hello', async () => handler);
void app.mount({ responseRouter: router.define });
// Event-name-specific overrides reject unsupported event names and invalid targets.
// @ts-expect-error unknown event name
app.events.event('not.an.event');
// @ts-expect-error unsupported destination scope
app.events.groupMessage({}, { Target: { scope: 'invalid', targetId: 'x' } });
void app.dispose();

app.actions.on('message.send', request => {
  const format = request.payload.params.format;
  void format;
  // @ts-expect-error unknown message-send parameter
  request.payload.params.notReal;
  return [createResult(ResultCode.Ok, 'OK', { id: 'typed' })];
});
