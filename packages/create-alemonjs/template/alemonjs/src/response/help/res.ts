import { renderComponentToBuffer } from 'jsxp';
import { Text, Image, useMessage } from 'alemonjs';

import Help from '@src/image/component/help';

export const selects = onSelects(['message.create']);

export default onResponse(selects, async event => {
  const [message] = useMessage(event);
  // pic
  const img = await renderComponentToBuffer('/help', Help, {
    data: 'AlemonJS 跨平台开发框架'
  });
  // send
  if (typeof img != 'boolean') {
    message.send(format(Image(img)));
  } else {
    message.send(format(Text('图片加载失败')));
  }
});
