import { withAppContext } from './app-context.js';
import { getRuntimeCore } from './store.js';

import { showErrorModule } from '../../common/utils.js';
import type { EventFinishedContext, EventStartContext, HttpErrorContext, StoreChildrenApp, RuntimeStatusChangeContext } from '../../types/index.js';

const swallowLifecycleError = (error: unknown) => {
  showErrorModule(error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Unknown lifecycle error'));
};

const getChildrenApps = (): StoreChildrenApp[] => {
  return Object.values(getRuntimeCore()?.storeChildrenApp ?? {});
};

const getChildrenApp = (name: string): StoreChildrenApp | null => {
  return getRuntimeCore()?.storeChildrenApp?.[name] ?? null;
};

export const dispatchEventStart = async (context: EventStartContext) => {
  const apps = getChildrenApps();

  for (const app of apps) {
    try {
      await withAppContext(app.name, () => app.cycle?.onEventStart?.(context));
    } catch (error) {
      swallowLifecycleError(error);
    }
  }
};

export const dispatchEventFinished = async (context: EventFinishedContext) => {
  const apps = getChildrenApps();

  for (const app of apps) {
    try {
      await withAppContext(app.name, () => app.cycle?.onEventFinished?.(context));
    } catch (error) {
      swallowLifecycleError(error);
    }
  }
};

export const dispatchHttpError = async (context: HttpErrorContext): Promise<boolean> => {
  const app = getChildrenApp(context.appName);
  const handler = app?.cycle?.onHttpError;

  if (!handler) {
    return false;
  }

  try {
    const result = await withAppContext(context.appName, () => handler(context));

    return result === 'handled';
  } catch (error) {
    swallowLifecycleError(error);

    return false;
  }
};

export const dispatchRuntimeStatusChange = async (context: RuntimeStatusChangeContext) => {
  const app = getChildrenApp(context.appName);
  const handler = app?.cycle?.onRuntimeStatusChange;

  if (!handler) {
    return;
  }

  try {
    await withAppContext(context.appName, () => handler(context));
  } catch (error) {
    swallowLifecycleError(error);
  }
};

export const dispatchAppReady = async (appName: string, store: { response: any[]; responseMiddleware: { [key: string]: any }; middleware: any[] }) => {
  const app = getChildrenApp(appName);
  const handler = app?.cycle?.onReady;

  if (!handler) {
    return;
  }

  await withAppContext(appName, () => handler(store));
};

export const dispatchAppDispose = async (appName: string, error?: unknown) => {
  const app = getChildrenApp(appName);

  if (!app?.cycle) {
    return;
  }

  try {
    if (app.cycle.onDispose) {
      await withAppContext(appName, () => app.cycle.onDispose(error));
    }
    if (app.cycle.unMounted) {
      await withAppContext(appName, () => app.cycle.unMounted(error));
    }
  } catch (disposeError) {
    swallowLifecycleError(disposeError);
  }
};

export const dispatchDisposeAllApps = async (error?: unknown) => {
  const apps = getChildrenApps();

  for (const app of apps) {
    await dispatchAppDispose(app.name, error);
  }
};
