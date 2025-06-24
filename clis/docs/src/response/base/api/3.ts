export const selects = onSelects(['message.create'])

const response$1 = onResponse(selects, (event, next) => {
  console.log('step 1')
  // 允许在同组响应中，继续后续的函数
  return true
})

const response$2 = onResponse(selects, (event, next) => {
  console.log('step 2')
  return {
    // 允许分组，等同于 return true
    allowGrouping: true
  }
})

const response$3 = onResponse(selects, (event, next) => {
  console.log('step 3')
})

const response = onResponse(selects, [response$1.current, response$2.current, response$3.current])

export default response
