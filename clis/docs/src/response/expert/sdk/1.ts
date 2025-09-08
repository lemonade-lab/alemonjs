import { platform as qqbot, useClient } from '@alemonjs/qq-bot';
export const selects = onSelects(['message.create']);
export default onResponse(selects, event => {
  if (event.platform === qqbot) {
    const [client, value] = useClient(event);
    // 使用原生api和数据
  }
});
