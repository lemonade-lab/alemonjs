import { useMention, useMessage, Format, createEvent } from 'alemonjs';

export default async e => {
  // 创建事件
  const event = createEvent({
    event: e,
    selects: ['message.create']
  });

  const [message] = useMessage(event);
  const [mention] = useMention(event);

  const userRes = await mention.findOne();
  if (!userRes.count || !userRes.data) {
    // 没有找到用户

    return;
  }
  const user = userRes.data;

  const format = Format.create();

  format.addText(`hello, ${user.UserName || user.UserId}!`);

  // 发送消息
  message.send({
    format
  });
};
