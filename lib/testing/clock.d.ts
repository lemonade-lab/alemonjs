//#region src/testing/clock.d.ts
/** Only framework-managed timers use this clock. Native timers remain native. */
declare function createTestClock(initial?: number): {
  now: () => number;
  timers: {
    set(callback: () => void, ms: number, repeat: boolean): number;
    clear(id: number): void;
  };
  advance(ms: number): Promise<void>;
  clear(): void;
  readonly pending: number;
};
//#endregion
export { createTestClock };