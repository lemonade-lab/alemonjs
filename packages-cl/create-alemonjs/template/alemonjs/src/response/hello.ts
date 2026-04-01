import { useMention, useMessage, Format } from 'alemonjs';

export default async () => {
  const [message] = useMessage();
  const [mention] = useMention();
  const format = Format.create();

  const userRes = await mention.findOne();
  if (!userRes.count || !userRes.data) {
    // 没有找到用户
    logger.warn('没有找到@用户');
    format.addText('没有找到@用户');
    message.send({
      format
    });
    return;
  }
  const user = userRes.data;

  format.addText(`hello, ${user.UserName || user.UserId}!`);

  // 发送消息
  message.send({
    format
  });
};
