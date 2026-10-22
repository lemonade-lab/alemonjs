import { Format, Media, useMedia, useMessage, ResultCode, type MediaResource } from 'alemonjs';
const context = { Platform: 'qq-bot', BotId: 'app', Target: { scope: 'group' as const, targetId: 'g' } };
const source = Media.image({ filePath: '/tmp/chart.png' });
Format.create().addImage(source);
Format.createMarkdown().addImage(source, { width: 800, height: 400 });
// @ts-expect-error A portable source has exactly one source field.
Media.image({ url: 'https://example.com/a.png', data: 'eA==' });
const [media] = useMedia(context);
async function check() {
  const legacy = await media.upload({ type: 'image', data: 'eA==' });
  const oldId: string = legacy.data.fileId;
  const prepared = await media.upload({ type: 'image', filePath: '/tmp/chart.png', usage: 'markdown' });
  if (prepared.code === ResultCode.Ok) {
    const resource: MediaResource = prepared.data;
    const md = Format.createMarkdown().addImage(resource);
    const results = await useMessage(context)[0].send(Format.create().addMarkdown(md).value);
    results[0].media?.resources.forEach(item => console.log(item.id));
    await media.delete(resource);
  }
  await media.list({ usage: 'markdown', cursor: 'next' });
  await media.capabilities();
  return oldId;
}
void check;
// @ts-expect-error Resource upload does not silently send a message.
media.upload({ type: 'image', data: 'eA==', usage: 'markdown', send: true });
