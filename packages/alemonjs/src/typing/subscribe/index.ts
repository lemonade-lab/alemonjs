import { SinglyLinkedList } from '../../datastructure/SinglyLinkedList'

/**
 * subscribe
 */

export type SubscribeValue = {
  keys: {
    [key: string]: string | number | boolean
  }
  current: Function
}

export type SubscribeMap = {
  [key: string]: SinglyLinkedList<SubscribeValue>
}

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
