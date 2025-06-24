export const selects = onSelects(['message.create'])

const response$1 = onResponse(selects, (event, next) => {
  return {
    id: 0
  }
})

const response = onResponse(selects, (event, next) => {
  const res = response$1.current(event, next)
  console.log('获得指定res的id', res.id)
})

export default response
