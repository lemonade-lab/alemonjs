import * as lark from '@larksuiteoapi/node-sdk';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { bytes, messageId, required, sendActions, text, withMedia, type Context } from './utils.js';

export function createDriver(ctx: Context, SDK: any = lark) {
  const c = ctx.config;

  required(c, 'app_id', 'app_secret');
  const options = { appId: c.app_id, appSecret: c.app_secret, domain: c.domain === 'lark' ? SDK.Domain.Lark : SDK.Domain.Feishu };
  const client = new SDK.Client(options);
  const ws = new SDK.WSClient(options);
  const dispatcher = new SDK.EventDispatcher({}).register({
    'im.message.receive_v1': (e: any) => {
      const m = e.message;
      let content: any = {};

      try {
        content = JSON.parse(m.content);
      } catch {}
      ctx.emit({
        user: e.sender.sender_id.open_id,
        username: e.sender.sender_id.user_id,
        id: m.message_id,
        channel: m.chat_id,
        private: m.chat_type === 'p2p',
        text: content.text ?? '',
        reply: m.parent_id,
        media:
          content.image_key || content.file_key
            ? [
                {
                  Type: m.message_type === 'image' ? 'image' : 'file',
                  FileId: content.image_key ?? content.file_key,
                  FileName: content.file_name
                }
              ]
            : [],
        atMe: Boolean(m.mentions?.some((x: any) => x.id?.open_id === c.bot_id)),
        raw: e
      });
    },
    'card.action.trigger': (e: any) => {
      ctx.emit({
        name: 'interaction.create',
        user: e.operator?.open_id,
        id: e.token,
        channel: e.context?.open_chat_id,
        text: e.action?.value?.action ?? JSON.stringify(e.action?.value ?? {}),
        interaction: e.action,
        raw: e
      });

      return {};
    },
    'im.chat.member.user.added_v1': (e: any) => {
      for (const u of e.users ?? []) {
        ctx.emit({ name: 'member.add', user: u.user_id?.open_id ?? u.open_id, channel: e.chat_id, raw: e });
      }
    },
    'im.chat.member.user.deleted_v1': (e: any) => {
      for (const u of e.users ?? []) {
        ctx.emit({ name: 'member.remove', user: u.user_id?.open_id ?? u.open_id, channel: e.chat_id, raw: e });
      }
    }
  });
  const check = (r: any) => {
    if (r.code !== 0) {
      throw new Error(`Feishu ${r.code}: ${r.msg}`);
    }

    return r.data;
  };
  const upload = async (p: any) => {
    const params = p.params ?? {};
    const source = params.url ?? (params.filePath ? pathToFileURL(resolve(params.filePath)).href : params.data ? `base64://${params.data}` : undefined);

    if (!source || !['image', 'audio', 'video', 'file'].includes(params.type)) {
      throw new Error('Feishu upload requires a supported type and media source');
    }
    const value =
      params.type === 'image'
        ? check(await client.im.image.create({ data: { image_type: 'message', image: await bytes(source) } }))
        : check(
            await client.im.file.create({
              data: {
                file_type: params.type === 'audio' ? 'opus' : params.type === 'video' ? 'mp4' : 'stream',
                file_name: params.name ?? (params.type === 'audio' ? 'audio.opus' : params.type === 'video' ? 'video.mp4' : 'upload'),
                file: await bytes(source)
              }
            })
          );
    const fileId = value?.image_key ?? value?.file_key;

    if (!fileId) {
      throw new Error('Feishu upload response missing media key');
    }

    return { fileId, value };
  };
  const encode = async (format: any[]) => {
    const output = [];

    for (const node of format) {
      if (node.type === 'PreparedMedia') {
        const type = node.options.mediaType;

        output.push({
          msg_type: type === 'image' ? 'image' : type === 'audio' ? 'audio' : 'file',
          content: JSON.stringify(type === 'image' ? { image_key: node.value } : { file_key: node.value })
        });
      } else if (['Image', 'ImageURL', 'ImageFile'].includes(node.type)) {
        const image = check(await client.im.image.create({ data: { image_type: 'message', image: await bytes(node.value) } }));

        output.push({ msg_type: 'image', content: JSON.stringify({ image_key: image.image_key }) });
      } else if (['Attachment', 'Audio', 'Video'].includes(node.type)) {
        const fileType = node.type === 'Audio' ? 'opus' : node.type === 'Video' ? 'mp4' : 'stream';
        const name = node.options?.filename ?? (node.type === 'Audio' ? 'audio.opus' : node.type === 'Video' ? 'video.mp4' : 'upload');
        const file = check(await client.im.file.create({ data: { file_type: fileType, file_name: name, file: await bytes(node.value) } }));

        output.push({
          msg_type: node.type === 'Audio' ? 'audio' : node.type === 'Video' ? 'file' : 'file',
          content: JSON.stringify({ file_key: file.file_key })
        });
      } else if (node.type === 'ButtonGroup' || node.type === 'BT.group') {
        const buttons = node.value
          .flatMap((r: any) => r.value)
          .map((b: any) => ({
            tag: 'button',
            text: { tag: 'plain_text', content: b.value },
            type: 'default',
            ...(b.options?.type === 'link' ? { url: b.options.data } : { value: { action: b.options?.data ?? b.value } })
          }));

        output.push({ msg_type: 'interactive', content: JSON.stringify({ elements: [{ tag: 'action', actions: buttons }] }) });
      } else {
        output.push({ msg_type: 'text', content: JSON.stringify({ text: text([node]) }) });
      }
    }
    if (!output.length) {
      throw new Error('Empty message');
    }

    return output;
  };
  const actions = {
    'media.upload': upload,
    ...sendActions(async (t, f, p) => {
      const results = [];

      for (const data of await encode(f)) {
        const r = p.params?.replyId
          ? await client.im.message.reply({ path: { message_id: p.params.replyId }, data })
          : await client.im.message.create({
              params: { receive_id_type: t.private ? 'open_id' : 'chat_id' },
              data: { receive_id: t.id, ...data }
            });
        const value = check(r);

        results.push(messageId(value, value?.message_id));
      }

      return results.length === 1 ? results[0] : results;
    }),
    'message.get': async (p: any) => check(await client.im.message.get({ path: { message_id: p.MessageId } })),
    'message.delete': async (p: any) => check(await client.im.message.delete({ path: { message_id: p.MessageId } })),
    'message.edit': async (p: any) => {
      const data = await encode(p.params?.format ?? []);

      if (data.length !== 1) {
        throw new Error('Message edit requires one native message');
      }

      return check(await client.im.message.update({ path: { message_id: p.MessageId }, data: data[0] }));
    },
    'channel.info': async (p: any) => check(await client.im.chat.get({ path: { chat_id: p.ChannelId } })),
    'channel.list': async (p: any) => check(await client.im.chat.list({ params: { page_size: p.params?.limit, page_token: p.params?.after } })),
    'channel.create': async (p: any) => check(await client.im.chat.create({ data: { name: p.params.name } })),
    'channel.update': async (p: any) => check(await client.im.chat.update({ path: { chat_id: p.ChannelId }, data: p.params })),
    'channel.delete': async (p: any) => check(await client.im.chat.delete({ path: { chat_id: p.ChannelId } })),
    'member.list': async (p: any) =>
      check(
        await client.im.chatMembers.get({
          path: { chat_id: p.GuildId },
          params: { member_id_type: 'open_id', page_size: p.params?.limit, page_token: p.params?.after }
        })
      ),
    'member.kick': async (p: any) =>
      check(
        await client.im.chatMembers.delete({
          path: { chat_id: p.GuildId },
          params: { member_id_type: 'open_id' },
          data: { id_list: [p.UserId] }
        })
      ),
    'history.list': async (p: any) =>
      check(
        await client.im.message.list({
          params: { container_id_type: 'chat', container_id: p.ChannelId, page_size: p.params?.limit, page_token: p.params?.after }
        })
      ),
    'reaction.add': async (p: any) =>
      check(await client.im.messageReaction.create({ path: { message_id: p.MessageId }, data: { reaction_type: { emoji_type: p.EmojiId } } })),
    'reaction.list': async (p: any) =>
      check(await client.im.messageReaction.list({ path: { message_id: p.MessageId }, params: { reaction_type: p.EmojiId, page_size: p.params?.limit } })),
    'reaction.remove': async (p: any) => {
      let page: string | undefined;
      const seen = new Set<string>();

      do {
        const result = check(
          await client.im.messageReaction.list({
            path: { message_id: p.MessageId },
            params: { reaction_type: p.EmojiId, page_token: page, page_size: 50 }
          })
        );
        const reaction = result.items?.find(
          (item: any) => item.operator?.operator_type === 'app' && item.operator.operator_id === c.app_id && item.reaction_type?.emoji_type === p.EmojiId
        );

        if (reaction?.reaction_id) {
          return check(await client.im.messageReaction.delete({ path: { message_id: p.MessageId, reaction_id: reaction.reaction_id } }));
        }
        if (!result.has_more) {
          break;
        }
        page = result.page_token;
        if (!page || seen.has(page)) {
          throw new Error('Feishu reaction pagination did not advance');
        }
        seen.add(page);
      } while (page);
      throw new Error('Feishu reaction owned by this app was not found');
    }
  };

  return {
    client,
    actions: withMedia(actions, ['image', 'audio', 'video', 'file'], ['image', 'audio', 'video', 'file']),
    status: () => (ws.getConnectionStatus?.().state === 'connected' ? 'ready' : ws.getConnectionStatus?.().state ?? 'connecting'),
    start: async () => {
      await ws.start({ eventDispatcher: dispatcher });
      if (ws.getConnectionStatus?.().state === 'connected') {
        ctx.ready(c.bot_id);
      }
    },
    stop: () => ws.close({ force: true })
  };
}
