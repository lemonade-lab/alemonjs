import { SinglyLinkedList } from '../../datastructure/SinglyLinkedList'
import { EventCycleEnum } from '../cycle'
import { EventKeys } from '../event/map'

/**
 * subscribe
 */

export type SubscribeValue = {
  choose: EventCycleEnum
  selects: EventKeys[]
  keys: {
    [key: string]: string | number | boolean
  }
  current: Function
  id: string
}

export type SubscribeMap = Map<string, SinglyLinkedList<SubscribeValue>>

export type SubscribeKeysMap = {
  create: SubscribeMap
  mount: SubscribeMap
  unmount: SubscribeMap
}

/**
 * state subscribe
 */
export interface StateSubscribeMap {
  [key: string]: Array<(value: boolean) => void>
}
