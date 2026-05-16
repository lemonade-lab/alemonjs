import { logger } from '../logger.js';
import { ResultCode } from '../variable.js';
import { HEARTBEAT_INTERVAL } from './constants.js';

export const useHeartbeat = ({ ping, isConnected, terminate }) => {
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let lastPong = Date.now();

  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  const callback = () => {
    if (isConnected()) {
      const diff = Date.now() - lastPong;
      const max = HEARTBEAT_INTERVAL * 2;

      if (diff > max) {
        logger.debug({
          code: ResultCode.Fail,
          message: '心跳超时，断开重连',
          data: null
        });
        terminate();

        return;
      }

      ping();
      logger.debug({
        code: ResultCode.Ok,
        message: '发送 ping',
        data: null
      });
      heartbeatTimer = setTimeout(callback, HEARTBEAT_INTERVAL);
    } else {
      stopHeartbeat();
      terminate();
    }
  };

  const startHeartbeat = () => {
    lastPong = Date.now();
    stopHeartbeat();
    callback();
  };

  const control = {
    start: startHeartbeat,
    stop: stopHeartbeat,
    pong: () => {
      lastPong = Date.now();
      logger.debug({
        code: ResultCode.Ok,
        message: '收到 pong',
        data: null
      });
    }
  };

  return [control];
};
