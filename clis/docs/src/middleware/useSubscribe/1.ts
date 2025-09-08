import { Text, useSubscribe, useMessage } from 'alemonjs';
import LoginRes from './login';
export const selects = onSelects(['message.create']);
// 中间件，在所有apps响应之前。
export default onMiddleware(selects, (event, next) => {
  // 非约定前缀
  if (!/^#xx/.test(event.MessageText)) {
    next();
    return;
  }

  // 不是
  if (!/^xx login/.test(event.MessageText)) {
    // 根据userid/userkey请求获得email
    const email = '';
    if (!email) {
      next();
      return;
    }
    // 拥有数据，携带字段
    event['xx_emeil'] = email;
    next();
    return;
  }

  // 创建
  const [message] = useMessage(event);
  message.send(format(Text('请输入 #xx email,password ')));

  // 在中间件响应之前，观察该用户
  const [subscribe] = useSubscribe(event, selects);
  subscribe.create(LoginRes.current, ['UserId']);
});
