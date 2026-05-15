import type { EventErrorContext } from '../types';
import { getChildrenApp } from './store.js';
import { showErrorModule } from '../core/utils.js';

/**
 * 分发给 app 级 onEventError。
 * 返回 true 表示继续当前链路，false 表示终止。
 */
export const dispatchEventError = async (context: EventErrorContext): Promise<boolean> => {
  const app = getChildrenApp(context.appName);
  const onEventError = app?.cycle?.onEventError;

  if (!onEventError) {
    return false;
  }

  try {
    const result = await onEventError(context);

    return result === 'continue';
  } catch (error) {
    showErrorModule(error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'onEventError failed'));

    return false;
  }
};
