const selects = onSelects([
  'message.create',
  'private.message.create',
  'interaction.create',
  'private.interaction.create'
])
export default onMiddleware(selects, async (_event, next) => {
  next()
})
