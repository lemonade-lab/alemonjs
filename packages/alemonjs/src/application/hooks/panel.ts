import type { ActionContext, MessagingActionMap } from '../../types';
import { createActionCaller } from './action-context';

/** Manage command panels and their audience. */
export const usePanel = (context?: ActionContext) => {
  const call = createActionCaller(context);

  return [
    {
      list: (params: MessagingActionMap['panel.list'][0]) => call('panel.list', params),
      create: (params: MessagingActionMap['panel.create'][0]) => call('panel.create', params),
      get: (id: string) => call('panel.get', { id }),
      update: (params: MessagingActionMap['panel.update'][0]) => call('panel.update', params),
      delete: (id: string) => call('panel.delete', { id }),
      updateTargets: (params: MessagingActionMap['panel.targets.update'][0]) => call('panel.targets.update', params)
    }
  ] as const;
};
