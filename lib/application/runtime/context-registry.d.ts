import { EventKeys } from "../../types/event/map.js";
import "../../types/index.js";
//#region src/application/runtime/context-registry.d.ts
type ContextRegistryEntry = {
  key: string;
  id: string;
  appName: string;
  events: readonly EventKeys[];
  onRemove?: () => void;
};
declare const activeContexts: Map<string, ContextRegistryEntry>;
declare const putActiveContext: (context: ContextRegistryEntry) => void;
declare const removeActiveContext: (key: string, id?: string) => boolean;
declare const getActiveContextKeys: (event: EventKeys) => Set<string>;
declare const clearActiveContextsByApp: (appName: string) => void;
declare const clearActiveContexts: () => void;
//#endregion
export { ContextRegistryEntry, activeContexts, clearActiveContexts, clearActiveContextsByApp, getActiveContextKeys, putActiveContext, removeActiveContext };