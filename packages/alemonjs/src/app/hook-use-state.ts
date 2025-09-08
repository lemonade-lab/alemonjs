import { getConfig } from '../core/config';
import { ResultCode } from '../core/code';
import { State, StateSubscribe } from './store';

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
 * @throws {Error} - 如果 name 不是字符串，或者 defaultValue 不是布尔值，抛出错误。
 */
export const useState = <T extends string>(name: T, defaultValue = true): [boolean, (value: boolean) => void] => {
  // 检查参数
  if (typeof name !== 'string') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid name: name must be a string',
      data: null
    });
    throw new Error('Invalid name: name must be a string');
  }
  if (typeof defaultValue !== 'boolean') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid defaultValue: defaultValue must be a boolean',
      data: null
    });
    throw new Error('Invalid defaultValue: defaultValue must be a boolean');
  }

  const state = new State(name, defaultValue);
  // 设置值的函数
  const setValue = (value: boolean) => {
    if (state.value == value) {
      return;
    }
    state.value = value;
    // 更新config
    const cfg = getConfig();

    if (!cfg.value.core) {
      cfg.value.core = {};
    }
    if (!cfg.value.core.state) {
      cfg.value.core.state = [];
    }
    const cfgState = cfg.value.core.state;
    const cur = cfgState.find((i: string) => i === name);

    if (cur !== value) {
      if (value) {
        cfg.value.core.state = cfg.value.core.state.filter((i: string) => i !== name);
      } else {
        cfg.value.core.state.push(name);
      }
    }
    cfg.saveValue(cfg.value);
  };

  return [state.value, setValue] as const;
};

/**
 * 订阅状态变化
 * @param name 功能名
 * @param callback 回调函数
 * @throws {Error} - 如果 callback 无效，抛出错误。
 */
export const onState = <T extends string>(name: T, callback: (value: boolean) => void) => {
  if (typeof callback !== 'function') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Callback must be a function',
      data: null
    });
    throw new Error('Callback must be a function');
  }
  const sub = new StateSubscribe(name);

  sub.on(callback);
};

/**
 * 取消订阅状态变化
 * @param name 功能名
 * @param callback 回调函数
 * @throws {Error} - 如果 callback 无效，抛出错误。
 */
export const unState = <T extends string>(name: T, callback: (value: boolean) => void) => {
  if (typeof callback !== 'function') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Callback must be a function',
      data: null
    });
    throw new Error('Callback must be a function');
  }
  // 取消订阅
  const sub = new StateSubscribe(name);

  sub.un(callback);
};
