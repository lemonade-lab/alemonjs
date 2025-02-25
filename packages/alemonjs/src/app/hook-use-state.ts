interface Subscribe {
  [key: string]: Array<(value: boolean) => void>
}

// 存储订阅者
const subscriptions: Subscribe = {}

// 初始化全局状态
alemonjsCore.storeState = new Proxy(
  {},
  {
    get(target, prop: string) {
      return prop in target ? target[prop] : false
    },
    set(target, prop: string, value: boolean) {
      target[prop] = value
      // 通知所有订阅者
      if (subscriptions[prop]) {
        for (const callback of subscriptions[prop]) {
          callback(value)
        }
      }
      return true // 表示设置成功
    }
  }
)

/**
 * 获取指定功能是启动还是关闭
 * ***
 * 当有其他地方调用时，
 * 默认值以第一次调用为准
 * ***
 * 功能名相同时，
 * 将会同时改变，因为状态是全局的
 * @param name 功能名
 * @param defaultValue 默认值，默认为 true
 * @returns 当前状态和设置函数
 */
export const useState = <T extends string>(
  name: T,
  defaultValue = true
): [boolean, (value: boolean) => void] => {
  // 如果不存在则设置默认值
  if (!(name in alemonjsCore.storeState)) {
    alemonjsCore.storeState[name] = defaultValue
  }

  // 设置值的函数
  const setValue = (value: boolean) => {
    alemonjsCore.storeState[name] = value
  }

  return [alemonjsCore.storeState[name], setValue]
}

/**
 * 订阅状态变化
 * @param name 功能名
 * @param callback 回调函数
 */
export const eventState = <T extends string>(name: T, callback: (value: boolean) => void) => {
  if (typeof callback !== 'function') {
    throw new Error('Callback must be a function')
  }

  if (!subscriptions[name]) {
    subscriptions[name] = []
  }

  subscriptions[name].push(callback)
}

/**
 * 取消订阅状态变化
 * @param name 功能名
 * @param callback 回调函数
 */
export const unEventState = <T extends string>(name: T, callback: (value: boolean) => void) => {
  if (subscriptions[name]) {
    subscriptions[name] = subscriptions[name].filter(cb => cb !== callback)
  }
}
