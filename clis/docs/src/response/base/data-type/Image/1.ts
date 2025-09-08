import { useMessage, Image } from 'alemonjs';
import url from '@src/assets/test.jpeg';
import { readFileSync } from 'node:fs';
export const selects = onSelects(['message.create']);
export default onResponse(selects, event => {
  const [message] = useMessage(event);
  // 发送本地图片文件
  message.send(format(Image.file(url)));
  // url
  message.send(format(Image.url('https://xxx.com/yyy.png')));
  // buffer
  const img = readFileSync(url);
  message.send(format(Image(img)));
});
