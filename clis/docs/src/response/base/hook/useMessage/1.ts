import { Text, useMessage } from 'alemonjs';
export const selects = onSelects(['message.create']);
export default onResponse(selects, (event, next) => {
  // 创建
  const [message] = useMessage(event);
  message.send(format(Text('hello word !')));
});
