import {
  MESSAGES_TYPE,
  DIRECT_MESSAGE_TYPE,
  meta_event_lifecycle,
  meta_event_heartbeat
} from './types'

export type OneBotEventMap = {
  DIRECT_MESSAGE: DIRECT_MESSAGE_TYPE
  MESSAGES: MESSAGES_TYPE
  META: meta_event_lifecycle | meta_event_heartbeat
  REQUEST_ADD_FRIEND: any
  REQUEST_ADD_GROUP: any
  NOTICE_GROUP_MEMBER_INCREASE: any
  NOTICE_GROUP_MEMBER_REDUCE: any
}
