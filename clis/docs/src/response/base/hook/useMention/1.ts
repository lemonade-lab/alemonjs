import { useMention } from 'alemonjs';
export const selects = onSelects(['message.create']);
export default onResponse(selects, async (event, next) => {
  const [mention] = useMention(event);
  // 查找用户类型的 @ 提及，且不是 bot
  const user = await mention.findOne();
  if (!user) {
    return; // 未找到用户Id
  }

  console.log('User:', user);

  // 处理被AT的用户...
});
