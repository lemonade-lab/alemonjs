import type { ActionContext, Menu } from '../../types';
import { createActionCaller } from './action-context';

/** Configure the bot's conversation menu. */
export const useMenu = (context?: ActionContext) => {
  const call = createActionCaller(context);

  return [{ get: () => call('menu.get', {}), set: (menu: Menu) => call('menu.set', { menu }) }] as const;
};
