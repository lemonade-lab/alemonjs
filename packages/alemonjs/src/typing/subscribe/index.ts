import { SinglyLinkedList } from '../../datastructure/SinglyLinkedList'

export type SubscribeValue = {
  keys: {
    [key: string]: string | number | boolean
  }
  current: Function
}

export type SubscribeMap = {
  [key: string]: SinglyLinkedList<SubscribeValue>
}

export type Subscribe = {
  create: SubscribeMap
  mount: SubscribeMap
  unmount: SubscribeMap
}
