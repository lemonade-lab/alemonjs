import { Next, PrivateEventMessageCreate, PublicEventMessageCreate } from 'alemonjs'

type EventMessageCreate = PrivateEventMessageCreate | PublicEventMessageCreate

/**
 * 定义响应
 * @param current
 * @returns
 */
export const OnMyResponse = (current: (event: EventMessageCreate, next: Next) => void) => {
  return OnResponse(
    (event, next) => {
      if (!/^(\/|#)/.test(event.MessageText)) {
        return next()
      }
      current(event, next)
    },
    ['message.create', 'private.message.create']
  )
}
