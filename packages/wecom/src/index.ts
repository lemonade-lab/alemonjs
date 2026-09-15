import AiBot from '@wecom/aibot-node-sdk';
import { cbpPlatform, createResult, definePlatform, FormatEvent, ResultCode } from 'alemonjs';
import { getMaster, getWecomConfig, platform } from './config.js';
import { dataToWecomMessage, toWecomProactiveMessage } from './format.js';

export { platform } from './config.js';
export type { Options } from './config.js';
export { dataToWecomMessage } from './format.js';
export { toWecomProactiveMessage } from './format.js';
export const API = AiBot;

const main = () => {
  const config = getWecomConfig();

  if (!config.bot_id || !config.secret) {
    throw new Error('[wecom] wecom.bot_id 和 wecom.secret 为必填配置');
  }

  const client: any = new (AiBot as any).WSClient({ botId: config.bot_id, secret: config.secret });
  const cbp = cbpPlatform(`ws://127.0.0.1:${process.env.port || 17117}`);
  const emitMessage = (frame: any, text: string, media?: any[]) => {
    const body = frame?.body ?? {};
    const UserId = String(body?.from?.userid ?? '');

    if (!UserId || !body?.msgid) {
      return;
    }
    const [IsMaster, UserKey] = getMaster(UserId);
    const isGroup = body.chattype === 'group' && body.chatid;
    const builder = FormatEvent.create(isGroup ? 'message.create' : 'private.message.create')
      .addPlatform({ Platform: platform, value: frame, BotId: String(body.aibotid ?? config.bot_id), IsPrivate: !isGroup, IsAtMe: false })
      .addUser({ UserId, UserKey, UserName: body?.from?.name, IsMaster, IsBot: false })
      .addMessage({ MessageId: String(body.msgid), ReplyId: body?.quote?.msgid ? String(body.quote.msgid) : undefined })
      .addText({ MessageText: text })
      .addOpen({ OpenId: String(body.chatid ?? UserId) });

    if (isGroup) {
      builder.addGuild({ GuildId: String(body.chatid), SpaceId: String(body.chatid) }).addChannel({ ChannelId: String(body.chatid) });
    }
    if (media?.length) {
      builder.addMedia({ MessageMedia: media });
    }
    cbp.send(builder.add({ tag: `wecom.${body.msgtype ?? 'message'}` }).value as any);
  };

  client.on('message.text', (frame: any) => emitMessage(frame, String(frame?.body?.text?.content ?? '')));
  // WeCom's media URLs are encrypted and cannot safely be exposed as MessageMedia.Url.
  // Keep the complete frame in event.value so callers can explicitly download it via client.downloadFile(url, aeskey).
  client.on('message.image', (frame: any) => emitMessage(frame, ''));
  client.on('message.file', (frame: any) => emitMessage(frame, ''));
  client.on('event.template_card_event', (frame: any) => {
    const body = frame?.body ?? {};
    const UserId = String(body?.from?.userid ?? '');

    if (!UserId) {
      return;
    }
    const [IsMaster, UserKey] = getMaster(UserId);

    cbp.send(
      FormatEvent.create('interaction.create')
        .addPlatform({ Platform: platform, value: frame, BotId: String(body.aibotid ?? config.bot_id) })
        .addGuild({ GuildId: String(body.chatid ?? ''), SpaceId: String(body.chatid ?? '') })
        .addChannel({ ChannelId: String(body.chatid ?? '') })
        .addUser({ UserId, UserKey, IsMaster, IsBot: false })
        .addMessage({ MessageId: String(body.msgid ?? '') })
        .addText({ MessageText: String(body?.event?.event_key ?? '') })
        .addOpen({ OpenId: String(body.chatid ?? UserId) })
        .addInteraction({ InteractionId: String(body.msgid ?? ''), InteractionData: body.event })
        .add({ tag: 'wecom.template_card_event' }).value
    );
  });

  const onAction = async (data: any, consume: any) => {
    if (!['message.send', 'message.send.channel', 'message.send.user'].includes(data.action)) {
      return;
    }
    try {
      const payload = data.payload || {};
      const eventFrame = payload.event?.value;
      const eventBody = eventFrame?.body;
      const target = payload.ChannelId || payload.UserId || eventBody?.chatid || eventBody?.from?.userid;
      const message = dataToWecomMessage(payload.params?.format ?? [], config.hideUnsupported);

      if (!target || !(message as any)[(message as any).msgtype]?.content) {
        return consume([createResult(ResultCode.FailParams, '缺少发送目标或消息内容', null)]);
      }
      let result;

      if (data.action === 'message.send' && eventFrame) {
        result = await client.reply(eventFrame, message);
      } else {
        result = await client.sendMessage(String(target), toWecomProactiveMessage(message));
      }

      consume([createResult(ResultCode.Ok, data.action, result)]);
    } catch (error: any) {
      consume([createResult(ResultCode.Fail, error?.message ?? error, null)]);
    }
  };

  cbp.onactions((data: any, consume: any) => void onAction(data, consume));
  void client.connect();
  global.client = client;
};

export default definePlatform({ main, name: platform });
