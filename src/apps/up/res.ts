export default OnResponse(
  (_, { next }) => {
    console.log('经过了这里')
    next()
  },
  'message.create',
  /起来/
)
