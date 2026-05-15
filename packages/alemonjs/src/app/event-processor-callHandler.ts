import { showErrorModule } from '../core';
import { finishCurrentTrace, withEventContext } from './hook-event-context';
import { dispatchEventError } from './event-error';
import type { EventErrorPhase } from '../types';

export const createCallHandler = valueEvent => {
  // 开始处理 handler
  const callHandler = (
    currents,
    nextEvent,
    meta?: {
      appName?: string;
      phase?: EventErrorPhase;
    }
  ) => {
    let index = 0;
    let isClose = false;
    let isNext = false;

    const start = async () => {
      if (index >= currents.length) {
        return;
      }
      if (isNext) {
        return;
      }
      if (isClose) {
        return;
      }

      try {
        // 统一使用 await，无需区分同步/异步函数
        const nextFn = (...cns: boolean[]) => {
          isNext = true;
          nextEvent(...cns);
        };
        const res = await withEventContext(valueEvent, nextFn, () => currents[index](valueEvent, nextFn), {
          appName: meta?.appName,
          phase: meta?.phase
        });

        // return true → 局部中间件放行，继续执行 children handler
        // return void/false → 处理完毕或拦截，停止当前链
        if (res !== true) {
          if (!isNext) {
            finishCurrentTrace('consumed');

            return;
          }

          isClose = true;
        }
      } catch (err) {
        finishCurrentTrace('error');
        const shouldContinue =
          meta?.appName && meta?.phase
            ? await dispatchEventError({
                event: valueEvent,
                error: err,
                appName: meta.appName,
                phase: meta.phase
              })
            : false;
        showErrorModule(err);

        if (shouldContinue) {
          nextEvent();

          return;
        }

        return;
      }

      ++index;
      void start();
    };

    void start();
  };

  return callHandler;
};
