export const selects = onSelects(['message.create']);

export default onResponse(selects, event => {
  logger.warn('RES中间件', event);
  return true;
});
