import { State, StateSubscribe } from './store'

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
  const state = new State(name, defaultValue)
  // 设置值的函数
  const setValue = (value: boolean) => {
    state.value = value
  }
  return [state.value, setValue]
}

/**
 * 订阅状态变化
 * @param name 功能名
 * @param callback 回调函数
 */
export const onState = <T extends string>(name: T, callback: (value: boolean) => void) => {
  if (typeof callback !== 'function') {
    throw new Error('Callback must be a function')
  }
  const sub = new StateSubscribe(name)
  sub.on(callback)
}

/**
 * 废弃，请使用 onState
 * @deprecated
 */
export const eventState = onState

/**
 * 取消订阅状态变化
 * @param name 功能名
 * @param callback 回调函数
 */
export const unState = <T extends string>(name: T, callback: (value: boolean) => void) => {
  const sub = new StateSubscribe(name)
  sub.un(callback)
}

/**
 * 废弃，请使用 unState
 * @deprecated
 */
export const unEventState = unState
