//#region src/core/cbp/file-transport.d.ts
/**
 * Writes a small, bounded CBP lifecycle mirror for unrelated local processes.
 * It is intentionally opt-in so regular applications perform no file I/O.
 */
declare const publishCBPFileEvent: (message: unknown) => void;
/** Stores CBP availability in the same current-state file when file transport is enabled. */
declare const publishCBPFileReady: (data: Record<string, unknown>) => void;
//#endregion
export { publishCBPFileEvent, publishCBPFileReady };