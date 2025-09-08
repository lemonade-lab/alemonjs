import { useSubscribe } from 'alemonjs';

export const selects = onSelects(['message.create']);

const res$1 = onResponse(selects, (event, next) => {
  // 创建
});

const res$2 = onResponse(selects, (event, next) => {
  // 响应之前
});

const res$3 = onResponse(selects, (event, next) => {
  // 响应之后
});

export default onResponse(selects, (event, next) => {
  const [subscribe] = useSubscribe(event, selects);
  subscribe.create(res$1.current, []);
  subscribe.mount(res$2.current, []);
  subscribe.unmount(res$3.current, []);
});
