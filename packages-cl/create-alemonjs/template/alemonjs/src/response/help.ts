import { renderComponentIsHtmlToBuffer } from 'jsxp';
import { useMessage, Format, useEvent } from 'alemonjs';
import Help from '@src/image/component/help';

export default async () => {
  const [event] = useEvent({
    selects: ['message.create']
  });
  logger.info('收到', event.current?.MessageText ?? '');
  const [message] = useMessage();
  const format = Format.create();
  // pic
  const img = await renderComponentIsHtmlToBuffer(Help, {
    data: 'ALemonJS 跨平台开发框架'
  });
  // send
  if (typeof img != 'boolean') {
    format.addImage(img);
    message.send({
      format
    });
  } else {
    format.addText('图片加载失败');
    message.send({
      format: format
    });
  }
};
