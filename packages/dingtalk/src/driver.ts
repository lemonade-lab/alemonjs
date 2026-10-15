import * as ding from 'dingtalk-stream';
import { RestClient, isContextTarget, required, sendActions, text, type Context } from './utils.js';
import { createRobotApi, type RobotApi } from './api.js';

export type DingTalkClient = {
  stream: ding.DWClient;
  robot: RobotApi;
  request: (path: string, body?: unknown, method?: string) => Promise<unknown>;
};

export function createDriver(ctx: Context, SDK: any = ding) {
  const c = ctx.config;

  required(c, 'client_id', 'client_secret', 'robot_code');
  const stream = new SDK.DWClient({ clientId: c.client_id, clientSecret: c.client_secret, autoReconnect: true });
  const api = new RestClient('https://api.dingtalk.com/v1.0/');
  let token = '';
  let expiry = 0;
  const request = async (path: string, body?: unknown, method = 'POST') => {
    if (Date.now() >= expiry) {
      const r = await api.request('oauth2/accessToken', 'POST', { appKey: c.client_id, appSecret: c.client_secret });

      token = r.accessToken;
      expiry = Date.now() + (r.expireIn - 60) * 1000;
      if (!token) {
        throw new Error('DingTalk access token missing');
      }
    }

    return new RestClient(api.base, { 'x-acs-dingtalk-access-token': token }).request(path, method, body);
  };
  // Session webhooks are bearer credentials. Do not place them in exported event.value.
  const sessions = new Map<string, { url: string; expires: number }>();

  stream.registerCallbackListener(SDK.TOPIC_ROBOT, (frame: any) => {
    const e = JSON.parse(frame.data);

    sessions.set(e.msgId, { url: e.sessionWebhook, expires: e.sessionWebhookExpiredTime });
    while (sessions.size > 2000) {
      sessions.delete(sessions.keys().next().value);
    }
    const { sessionWebhook: _sessionWebhook, ...safe } = e;
    const richText = e.msgtype === 'richText' ? e.content?.richText ?? [] : [];
    const images = e.msgtype === 'picture' ? [e.content] : richText.filter((item: any) => item.downloadCode);

    ctx.emit({
      user: e.senderStaffId ?? e.senderId,
      username: e.senderNick,
      id: e.msgId,
      channel: e.conversationId,
      private: e.conversationType === '1',
      text: e.text?.content ?? richText.map((item: any) => item.text ?? '').join(''),
      media: images.filter((item: any) => item?.downloadCode).map((item: any) => ({ Type: 'image', FileId: item.downloadCode })),
      bot: e.chatbotUserId,
      atMe: Boolean(e.isInAtList),
      raw: safe
    });
    stream.socketCallBackResponse(frame.headers.messageId, { status: 'SUCCESS' });
    ctx.ready(e.chatbotUserId);
  });
  stream.registerCallbackListener(SDK.TOPIC_CARD, (frame: any) => {
    const e = JSON.parse(frame.data);

    ctx.emit({
      name: 'interaction.create',
      user: e.userId ?? e.operatorId,
      id: frame.headers.messageId,
      channel: e.openConversationId,
      text: JSON.stringify(e.value ?? {}),
      interaction: e.value,
      raw: e
    });
    stream.socketCallBackResponse(frame.headers.messageId, { status: 'SUCCESS' });
  });
  const robot = createRobotApi(request);
  const client: DingTalkClient = { stream, request, robot };
  const actions = sendActions(async (target, format, p) => {
    const content = text(format);

    if (!content) {
      throw new Error('Empty message');
    }
    const session = isContextTarget(p, target) ? sessions.get(p.event?.MessageId) : undefined;

    if (session && session.expires > Date.now()) {
      const url = new URL(session.url);

      if (url.protocol !== 'https:' || !['oapi.dingtalk.com', 'api.dingtalk.com'].includes(url.hostname)) {
        throw new Error('Invalid DingTalk session webhook');
      }
      const r = await new RestClient(`${url.origin}/`).request(`${url.pathname}${url.search}`, 'POST', {
        msgtype: 'text',
        text: { content }
      });

      return { value: r }; // The session webhook does not return a message ID.
    }
    const body = {
      robotCode: c.robot_code,
      msgKey: 'sampleText',
      msgParam: JSON.stringify({ content }),
      ...(target.private ? { userIds: [target.id] } : { openConversationId: target.id })
    };
    const r = target.private
      ? await robot.batchSendOTO({ ...body, userIds: [target.id] })
      : await robot.orgGroupSend({ ...body, openConversationId: target.id });

    if (!r.processQueryKey) {
      throw new Error('DingTalk send response missing processQueryKey');
    }

    return { processQueryKey: r.processQueryKey, value: r };
  });

  // A recall requires a send receipt's processQueryKey, not the incoming msgId.
  // Keep it explicit rather than registering an incompatible message.delete.
  actions['reaction.add'] = async (p: any) => {
    const result = await robot.robotReplyEmotion({
      robotCode: c.robot_code,
      openConversationId: p.ChannelId ?? p.event?.ChannelId,
      openMsgId: p.MessageId,
      emotionName: p.EmojiId
    });

    if (result.success !== true) {
      throw new Error('DingTalk reaction rejected');
    }

    return result;
  };
  actions['reaction.remove'] = async (p: any) => {
    const result = await robot.robotRecallEmotion({
      robotCode: c.robot_code,
      openConversationId: p.ChannelId ?? p.event?.ChannelId,
      openMsgId: p.MessageId,
      emotionName: p.EmojiId
    });

    if (result.success !== true) {
      throw new Error('DingTalk reaction removal rejected');
    }

    return result;
  };

  return {
    client,
    actions,
    start: async () => {
      await stream.connect();
      if (stream.connected) {
        ctx.ready(c.robot_code);
      }
    },
    stop: () => stream.disconnect()
  };
}
