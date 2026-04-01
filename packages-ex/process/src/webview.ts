import { getPackages, storage } from './storage.js';
import { updateModules } from './modules.js';
import { sendWebviewOnExpansionsMessage } from './send.js';
/**
 *
 * @param data
 * @returns
 */
export const webviewPostMessage = (data: any) => {
  if (!storage.has(data.name)) {
    return;
  }
  const pkg = storage.get(data.name);

  if (!pkg?.view) {
    return;
  }
  // 执行回调函数。
  pkg.view.__messages.forEach(callback => {
    callback(data.value);
  });
};

/**
 *
 * @param data
 * @returns
 */
export const webviewGetExpansions = (data: any) => {
  if (!storage.has(data.name)) {
    return;
  }
  updateModules();
  // 更新模块列表
  sendWebviewOnExpansionsMessage({
    name: data.name,
    value: {
      type: 'get-expansions',
      data: getPackages()
    }
  });
};
