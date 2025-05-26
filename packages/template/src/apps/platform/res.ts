const selects = onSelects([
  'message.create',
  'private.message.create',
  'interaction.create',
  'private.interaction.create'
])

export const regular = /^(#|\/)?platform$/

export default onResponse(selects, (event, next) => {})
