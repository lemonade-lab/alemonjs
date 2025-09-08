import { useMessage, Text, Mention } from 'alemonjs';
export const selects = onSelects(['message.create']);
export default onResponse(selects, event => {
  const [message] = useMessage(event);
  // 发送多种类型的消息
  message.send(format(Text('Hello '), Mention(event.UserId), Text(', How are things going?')));
  // @ 所有人
  message.send(format(Mention()));
  // @ channel
  message.send(
    format(
      Mention(event.ChannelId, {
        belong: 'channel'
      })
    )
  );
});
