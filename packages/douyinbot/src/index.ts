import { createHash, timingSafeEqual } from 'crypto';
import { createServer } from 'http';
import { cbpPlatform, createResult, definePlatform, FormatEvent, logger, ResultCode } from 'alemonjs';
import { getDouyinConfig, getMaster, platform } from './config.js';
import { dataToDouyinContent } from './format.js';

export { platform } from './config.js';
export type { Options } from './config.js';
export { dataToDouyinContent } from './format.js';

const maxWebhookBodyBytes = 1024 * 1024;

const readBody = (req: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxWebhookBodyBytes) {
        reject(new Error('request body too large'));
        req.destroy();

        return;
      }
      chunks.push(Buffer.from(chunk));
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
};

const signatureIsValid = (secret: string, raw: Buffer, signature: string | undefined) => {
  if (!signature) {
    return false;
  }
  const expected = createHash('sha1').update(secret).update(raw).digest('hex');
  const actual = String(signature).toLowerCase();

  return actual.length === expected.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
};

const parseContent = (value: unknown) => {
  if (typeof value === 'string') {
    return JSON.parse(value);
  }

  return value && typeof value === 'object' ? value : {};
};

const isDouyinFailure = (result: any) => Number(result?.err_no ?? result?.error_code ?? result?.extra?.error_code ?? 0) !== 0;

const main = () => {
  const config = getDouyinConfig();

  if (!config.client_key || !config.client_secret) {
    throw new Error('[douyinbot] douyinbot.client_key 和 douyinbot.client_secret 为必填配置');
  }
  const cbp = cbpPlatform(`ws://127.0.0.1:${process.env.port || 17117}`);
  const base = config.api_base_url || 'https://open.douyin.com';
  const seen = new Map<string, number>();
  let tokenCache: { value: string; expiresAt: number } | undefined;
  const getClientToken = async () => {
    if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
      return tokenCache.value;
    }
    const response = await fetch(`${base}/oauth/client_token/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client_key: config.client_key, client_secret: config.client_secret, grant_type: 'client_credential' })
    });
    const data: any = await response.json();
    const value = data?.data?.access_token ?? data?.access_token;

    if (!response.ok || !value) {
      throw new Error(data?.message ?? data?.err_msg ?? '获取抖音 client token 失败');
    }
    tokenCache = { value, expiresAt: Date.now() + Number(data?.data?.expires_in ?? data?.expires_in ?? 7200) * 1000 };

    return value;
  };
  const emitMessage = (event: any) => {
    const content: any = parseContent(event.content);
    const UserId = String(event.from_user_id ?? content.open_id ?? '');

    if (!UserId) {
      return;
    }
    const [IsMaster, UserKey] = getMaster(UserId);
    const isGroup = event.event === 'im_group_receive_msg' || Boolean(content.im_group_id);
    const ChannelId = String(content.im_group_id ?? content.conversation_short_id ?? '');
    const MessageText = String(content.text?.content ?? content.content ?? content.text ?? '');
    const builder = FormatEvent.create(isGroup ? 'message.create' : 'private.message.create')
      .addPlatform({ Platform: platform, value: event, BotId: config.client_key, IsPrivate: !isGroup, IsAtMe: false })
      .addUser({
        UserId,
        UserKey,
        UserName: content.user_infos?.find((item: any) => String(item.open_id) === UserId)?.nick_name,
        UserAvatar: content.user_infos?.find((item: any) => String(item.open_id) === UserId)?.avatar,
        IsMaster,
        IsBot: false
      })
      .addMessage({ MessageId: String(content.server_message_id ?? event.log_id ?? '') })
      .addText({ MessageText })
      .addOpen({ OpenId: isGroup ? ChannelId : UserId });

    if (isGroup) {
      (builder as any).addGuild({ GuildId: ChannelId, SpaceId: ChannelId }).addChannel({ ChannelId });
    }
    const mediaType = content.message_type === 'user_local_image' ? 'image' : content.message_type === 'user_local_video' ? 'video' : undefined;

    if (mediaType) {
      (builder as any).addMedia({ MessageMedia: [{ Type: mediaType as any, FileId: content.server_message_id }] });
    }
    cbp.send(builder.add({ tag: `douyinbot.${event.event}` }).value as any);
  };

  const callback = {
    host: config.callback?.host ?? '127.0.0.1',
    port: Number(config.callback?.port ?? 18080),
    path: config.callback?.path ?? '/callbacks/douyinbot'
  };
  const onCallback = async (req: any, res: any) => {
    const requestPath = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname;

    if (req.method !== 'POST' || requestPath !== callback.path) {
      res.writeHead(404).end();

      return;
    }
    try {
      const raw = await readBody(req);

      if (!signatureIsValid(config.client_secret, raw, req.headers['x-douyin-signature'] as string | undefined)) {
        res.writeHead(401).end('invalid signature');

        return;
      }
      const event = JSON.parse(raw.toString('utf8'));

      if (event.client_key && event.client_key !== config.client_key) {
        res.writeHead(403).end('unexpected client_key');

        return;
      }

      if (event.event === 'verify_webhook') {
        res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }).end(JSON.stringify({ challenge: event?.content?.challenge }));

        return;
      }
      const msgId = String(req.headers['msg-id'] ?? event.log_id ?? '');
      const duplicate = msgId && seen.has(msgId);

      if (msgId) {
        seen.set(msgId, Date.now());
      }
      for (const [id, at] of seen) {
        if (at < Date.now() - 10 * 60_000) {
          seen.delete(id);
        }
      }
      res.writeHead(200, { 'content-type': 'application/json' }).end('{}');
      if (!duplicate && ['im_receive_msg', 'im_group_receive_msg'].includes(event.event)) {
        emitMessage(event);
      }
    } catch (_error) {
      res.writeHead(400).end('invalid request');
    }
  };
  const server = createServer((req, res) => void onCallback(req, res));

  server.on('error', error => {
    logger.error({ code: ResultCode.FailInternal, message: `[douyinbot] Webhook 服务启动失败: ${error.message}`, data: error });
  });
  server.listen(callback.port, callback.host);

  const onAction = async (data: any, consume: any) => {
    if (data.action !== 'message.send') {
      return;
    }
    try {
      const payload = data.payload || {};
      const rawEvent = payload.event?.value;
      const rawContent: any = parseContent(rawEvent?.content);
      const target = String(rawEvent?.from_user_id ?? '');
      const content = dataToDouyinContent(payload.params?.format ?? [], config.hideUnsupported);

      if (rawEvent?.event !== 'im_receive_msg' || !target || !rawContent.server_message_id || !rawContent.conversation_short_id || !content.text.content) {
        return consume([createResult(ResultCode.FailParams, '抖音回复必须来自 im_receive_msg 事件，并包含会话上下文和非空文本', null)]);
      }
      const token = await getClientToken();
      const response = await fetch(`${base}/im/send/msg/`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'access-token': token },
        body: JSON.stringify({
          content,
          to_user_id: target,
          msg_id: rawContent.server_message_id,
          conversation_id: rawContent.conversation_short_id,
          scene: rawEvent.event
        })
      });
      const result: any = await response.json();

      if (!response.ok || isDouyinFailure(result)) {
        throw new Error(result?.err_msg ?? result?.message ?? '发送抖音私信失败');
      }
      consume([createResult(ResultCode.Ok, data.action, result)]);
    } catch (error: any) {
      consume([createResult(ResultCode.Fail, error?.message ?? error, null)]);
    }
  };

  cbp.onactions((data: any, consume: any) => void onAction(data, consume));
  process.once('SIGTERM', () => server.close());
  process.once('SIGINT', () => server.close());
};

export default definePlatform({ main, name: platform });
