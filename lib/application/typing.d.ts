//#region src/application/typing.d.ts
type TypingOptions = {
  duration?: number;
  intervalMs?: number;
  maxDurationMs?: number;
  signal?: AbortSignal;
  onError?: (error: unknown) => void | Promise<void>;
};
/** Starts immediately, never overlaps requests, and only stops local refreshes.
 * The platform's already-visible indicator expires on its own. */
declare const startTypingIndicator: (send: (duration: number) => Promise<unknown>, options?: TypingOptions) => () => void;
declare const runWithTyping: <T>(send: (duration: number) => Promise<unknown>, task: () => Promise<T>, options?: TypingOptions) => Promise<T>;
//#endregion
export { TypingOptions, runWithTyping, startTypingIndicator };