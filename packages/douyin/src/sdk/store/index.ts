// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
export { AccountStore, type AccountStoreOptions } from './account.js';
export { checkSessionHealth, parseSidGuardTtl, type LocalSessionHealth } from './session-health.js';
export { evaluateLocalRestore, type RestoreOutcome } from './wake.js';
export type { AccountRecord, AccountSession } from './types.js';
