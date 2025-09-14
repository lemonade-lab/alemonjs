const selects = onSelects(['message.create', 'private.message.create']);

export default onMiddleware(selects, (event, next) => {
  logger.info('中间件被触发');

  next();
});
