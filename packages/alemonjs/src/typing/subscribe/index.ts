export type SubscribeMap = {
  [key: string]: {
    keys: {
      [key: string]: string | number | boolean
    }
    current: Function
  }[]
}

export type Subscribe = {
  create: SubscribeMap
  mount: SubscribeMap
  mountAfter: SubscribeMap
  unmount: SubscribeMap
}
