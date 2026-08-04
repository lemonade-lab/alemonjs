import type { EventKeys } from '../../types/index.js';

export type ContextRegistryEntry = {
  key: string;
  id: string;
  appName: string;
  events: readonly EventKeys[];
  onRemove?: () => void;
};

export const activeContexts = new Map<string, ContextRegistryEntry>();
const activeContextKeysByEvent = new Map<EventKeys, Set<string>>();

export const putActiveContext = (context: ContextRegistryEntry) => {
  const previous = activeContexts.get(context.key);

  if (previous) {
    removeActiveContext(previous.key, previous.id);
  }

  activeContexts.set(context.key, context);

  for (const event of context.events) {
    const keys = activeContextKeysByEvent.get(event) ?? new Set<string>();

    keys.add(context.key);
    activeContextKeysByEvent.set(event, keys);
  }
};

export const removeActiveContext = (key: string, id?: string) => {
  const context = activeContexts.get(key);

  if (!context || (id && context.id !== id)) {
    return false;
  }

  activeContexts.delete(key);

  for (const event of context.events) {
    const keys = activeContextKeysByEvent.get(event);

    keys?.delete(key);

    if (keys?.size === 0) {
      activeContextKeysByEvent.delete(event);
    }
  }

  try {
    context.onRemove?.();
  } catch {
    // Cleanup must not leave stale registry entries behind.
  }

  return true;
};

export const getActiveContextKeys = (event: EventKeys) => activeContextKeysByEvent.get(event) ?? new Set<string>();

export const clearActiveContextsByApp = (appName: string) => {
  for (const context of activeContexts.values()) {
    if (context.appName === appName) {
      removeActiveContext(context.key, context.id);
    }
  }
};

export const clearActiveContexts = () => {
  for (const context of [...activeContexts.values()]) {
    removeActiveContext(context.key, context.id);
  }
};
