import { Image, useMessage } from 'alemonjs';
import img_url from '../../asstes/alemonjs.png';
import { readFileSync } from 'fs';
export const regular = /^(#|\/)?image$/;
const selects = onSelects(['message.create', 'private.message.create']);
export default onResponse(selects, (event, _next) => {
  const [message] = useMessage(event);
  const buff = readFileSync(img_url);
  message.send(format(Image(buff)));
  return true;
});
