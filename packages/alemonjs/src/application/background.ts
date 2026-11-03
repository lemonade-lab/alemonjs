import { runtimeExecution, runtimeScope } from '../common/runtime-scope.js';
import { currentCallerApp } from './expose.js';
import { withAppContext } from './runtime/app-context.js';
import { withoutEventContext } from './runtime/hook-event-context.js';

/**
 * Capture the current plugin for a background callback, without retaining a
 * player's event, next callback, trace or parent Expose invocation.
 * This is execution context, never delegation of player permission.
 */
export function createBackgroundRunner<Args extends unknown[], Result>(callback: (...args: Args) => Result): (...args: Args) => Result {
  const owner = currentCallerApp();
  const scope = runtimeScope.getStore();

  if (!owner) {
    throw new Error('Background callbacks require a plugin context');
  }

  return (...args: Args): Result => {
    if (scope?.disposed) {
      throw new Error('Background callback runtime is disposed');
    }

    return runtimeScope.run(scope, () => runtimeExecution.run(undefined, () => withAppContext(owner, () => withoutEventContext(() => callback(...args)))));
  };
}
