import { isAsyncFunction } from 'util/types';
import { CurrentResultValue } from '../types';
import { useMessage } from './hook-use-api';

export const createMiddlewareCallHandler = valueEvent => {
  const [message] = useMessage(valueEvent);

  // 开始处理 heandler
  const callHandler = (currents, nextMiddleware) => {
    let index = 0;
    let isClose = false;
    let isNext = false;
    /**
     *
     * @param res
     * @returns
     */
    const onRes = (res: CurrentResultValue) => {
      if (!res) {
        isClose = true;
      } else if (Array.isArray(res)) {
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
      if (isAsyncFunction(currents[index])) {
        const res = await currents[index](valueEvent, (...cns: boolean[]) => {
          isNext = true;
          nextMiddleware(...cns);
        });

        onRes(res);
      } else {
        const res = currents[index](valueEvent, (...cns: boolean[]) => {
          isNext = true;
          nextMiddleware(...cns);
        });

        onRes(res);
      }
      ++index;
      void start();
    };

    void start();
  };

  return callHandler;
};
