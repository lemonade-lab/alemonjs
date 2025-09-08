import { Text, useMessage } from 'alemonjs';
export const regular = /^(#|\/)?test$/;
const selects = onSelects(['message.create', 'private.message.create']);
export default onResponse(selects, (event, _next) => {
  const [message] = useMessage(event);
  message.send(format(Text('Hello! 你好呀！👋')));
  return true;
});
