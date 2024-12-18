import { OnResponse, useObserver } from 'alemonjs'
// import TestOnResponse from './test/res'
export default OnResponse((e, next) => {
  if (!/^apps/.test(e.MessageText)) {
    next()
    return
  }
  // 调用其他匹配
  // TestOnResponse.current(e, next)
  // 订阅复用
  // const Observer = useObserver(e, 'message.create')
  // 观察UserId，当UserId发生变化时，重新执行TestOnResponse.current方法。
  // Observer(TestOnResponse.current, ['UserId'])
  // 逻辑处理。
}, 'message.create')
