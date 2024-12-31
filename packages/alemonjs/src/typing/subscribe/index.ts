type Value = {
  keys: {
    [key: string]: string | number | boolean
  }
  current: Function
}

export type SubscribeMap = {
  [key: string]: (Value | undefined)[]
}

export type Subscribe = {
  create: SubscribeMap
  mount: SubscribeMap
  unmount: SubscribeMap
}
