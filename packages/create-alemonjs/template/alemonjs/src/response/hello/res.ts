import { Text, useMessage } from 'alemonjs';
export const selects = onSelects(['message.create']);
export default onResponse(selects, event => {
  // 创建
  const [message] = useMessage(event);
  // 发送消息
  message.send(format(Text('hello Word')));
});
