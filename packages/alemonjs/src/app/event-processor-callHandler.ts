import { CurrentResultValue } from '../types';
import { showErrorModule } from '../core';
import { useMessage } from './hook-use-api';

export const createCallHandler = valueEvent => {
  const [message] = useMessage(valueEvent);

  // 开始处理 handler
  const callHandler = (currents, nextEvent) => {
    let index = 0;
    let isClose = false;
    let isNext = false;

    const onRes = (res: CurrentResultValue) => {
      if (!res) {
        isClose = true;

        return;
      }
      if (Array.isArray(res)) {
        if (res.length > 0) {
          // 发送数据
          void message.send(res);
        }
        isClose = true;
      } else if (typeof res === 'object') {
        if (Array.isArray(res.data)) {
          // 发送数据
          void message.send(res.data);
        }
        if (!res.allowGrouping) {
          isClose = true;
        }
      }
    };

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
        const res = await currents[index](valueEvent, (...cns: boolean[]) => {
          isNext = true;
          nextEvent(...cns);
        });

        onRes(res);
      } catch (err) {
        showErrorModule(err);

        return;
      }

      ++index;
      void start();
    };

    void start();
  };

  return callHandler;
};
