// 不匹配该正则，自动进行next
export const regular = /^(#|\/)?hello$/
export const selects = onSelects(['message.create'])
export default onResponse(selects, event => {
  // your code
})
