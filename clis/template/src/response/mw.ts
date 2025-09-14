import { Text, useMessage } from 'alemonjs';

const selects = onSelects(['message.create', 'private.message.create']);

export default onMiddleware(selects, (event, _next) => {
  const [message] = useMessage(event);
  message.send(format(Text('Hello! 你好呀！👋')));

  // 局部中间件 共享 next。执行next 说明跳过后续的链路来继续匹配。

  // 交给下一个中间件
  return true;
});
