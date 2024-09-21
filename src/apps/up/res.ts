import { OnResponse, useObserver, useWithdraw, useReply } from 'alemonjs'
export default OnResponse(
  (event, { next }) => {
    // 引用回复消息。
    useReply()

    // 撤销消息
    useWithdraw(event)

    // 观察到相同数据时，执行
    useObserver(
      event => {
        //
      },
      ['MsgId']
    )

    //
  },
  'message.create',
  /起来/
)
