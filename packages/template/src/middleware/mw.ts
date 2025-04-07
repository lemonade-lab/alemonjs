import { createSelects } from 'alemonjs'
const selects = createSelects([
  'message.create',
  'private.message.create',
  'interaction.create',
  'private.interaction.create'
])
export default onMiddleware(selects, async (_event, next) => {
  next()
})
