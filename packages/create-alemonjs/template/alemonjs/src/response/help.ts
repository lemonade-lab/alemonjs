import { renderComponentToBuffer } from 'jsxp';
import { useMessage, createEvent, Format } from 'alemonjs';
import Help from '@src/image/component/help';

export default async (e, next) => {
  console.warn('help RES', e);
  // 创建事件
  const event = createEvent({
    event: e,
    selects: ['message.create']
  });
  // 事件不匹配
  if (!event.selects) {
    next();
    return;
  }
  const [message] = useMessage(event);
  const format = Format.create();
  // pic
  const img = await renderComponentToBuffer('/help', Help, {
    data: 'AlemonJS 跨平台开发框架'
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
