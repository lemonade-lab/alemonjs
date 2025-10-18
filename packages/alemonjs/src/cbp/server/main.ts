import Koa from 'koa';
import { WebSocketServer, WebSocket } from 'ws';
import * as JSON from 'flatted';
import * as flattedJSON from 'flatted';
import koaCors from '@koa/cors';
import MessageRouter from '../routers/router';
import { ResultCode, getConfig } from '../../core';
import {
  childrenBind,
  childrenClient,
  DEVICE_ID_HEADER,
  FULL_RECEIVE_HEADER,
  fullClient,
  platformClient,
  USER_AGENT_HEADER,
  USER_AGENT_HEADER_VALUE_MAP
} from '../processor/config';
import type { ParsedMessage } from '../typings';
import { createTestOneController } from './testone';

// 处理api
const handleApi = (DeviceId: string, message: string) => {
  // 指定的设备 处理消费。终端有记录每个客户端是谁
  if (childrenClient.has(DeviceId)) {
    const clientWs = childrenClient.get(DeviceId);

    if (clientWs && clientWs.readyState === WebSocket.OPEN) {
      // 发送消息到指定的子客户端
      clientWs.send(message);
    } else {
      // 如果连接已关闭，删除该客户端
      childrenClient.delete(DeviceId);
    }
  } else if (fullClient.has(DeviceId)) {
    const clientWs = fullClient.get(DeviceId);

    if (clientWs && clientWs.readyState === WebSocket.OPEN) {
      // 发送消息到指定的全量客户端
      clientWs.send(message);
    } else {
      // 如果连接已关闭，删除该客户端
      fullClient.delete(DeviceId);
    }
  }
};

// 处理 action
const handleAction = (DeviceId: string, message: string) => {
  if (childrenClient.has(DeviceId)) {
    const clientWs = childrenClient.get(DeviceId);

    if (clientWs && clientWs.readyState === WebSocket.OPEN) {
      // 发送消息到指定的子客户端
      clientWs.send(message);
    } else {
      // 如果连接已关闭，删除该客户端
      childrenClient.delete(DeviceId);
    }
  } else if (fullClient.has(DeviceId)) {
    const clientWs = fullClient.get(DeviceId);

    if (clientWs && clientWs.readyState === WebSocket.OPEN) {
      // 发送消息到指定的全量客户端
      clientWs.send(message);
    } else {
      // 如果连接已关闭，删除该客户端
      fullClient.delete(DeviceId);
    }
  }
};

// 处理事件
const handleEvent = (message: string, ID: string) => {
  // 全量客户端
  fullClient.forEach((clientWs, clientId) => {
    // 检查状态 并检查状态
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(message);
    } else {
      // 如果连接已关闭，删除该客户端
      childrenClient.delete(clientId);
    }
  });
  // 根据所在群进行分流。
  // 确保同一个频道的消息。都流向同一个客户端。
  if (!ID) {
    logger.error({
      code: ResultCode.Fail,
      message: '消息缺少标识符 ID',
      data: null
    });

    return;
  }
  // 重新绑定并发送消息
  const reBind = () => {
    if (childrenClient.size === 0) {
      return;
    } else if (childrenClient.size === 1) {
      // 只有一个客户端，直接绑定
      const [bindId, clientWs] = childrenClient.entries().next().value;

      childrenBind.set(ID, bindId);
      clientWs.send(message);

      return;
    }
    // 有多个客户端，找到绑定最少的那个。
    // 如果大家都一样。就拿最近的第一个直接绑定。
    let minBindCount = Infinity;
    let bindId: string | null = null;

    childrenClient.forEach((_, id) => {
      const count = Array.from(childrenBind.values()).filter(v => v === id).length;

      if (count < minBindCount) {
        minBindCount = count;
        bindId = id;
      }
    });
    if (bindId) {
      const clientWs = childrenClient.get(bindId);

      if (clientWs && clientWs.readyState === WebSocket.OPEN) {
        // 进行绑定
        childrenBind.set(ID, bindId);
        // 发送消息到绑定的客户端
        clientWs.send(message);
      } else {
        // 如果连接已关闭，删除该客户端
        childrenClient.delete(bindId);
        // 重新进行绑定
        reBind();
      }
    } else {
      logger.error({
        code: ResultCode.Fail,
        message: '服务端出现意外，无法绑定客户端',
        data: null
      });
    }
  };

  // 判断该id是否被分配过
  if (!childrenBind.has(ID)) {
    // 进行绑定
    reBind();

    return;
  }
  const bindId = childrenBind.get(ID);

  if (!childrenClient.has(bindId)) {
    // 出现意外。
    // 重新进行绑定。
    reBind();

    return;
  }
  const clientWs = childrenClient.get(bindId);

  if (!clientWs || clientWs.readyState !== WebSocket.OPEN) {
    // 如果连接已关闭，删除该客户端
    childrenClient.delete(bindId);
    // 重新进行绑定
    reBind();

    return;
  }
  clientWs.send(message);
};

// 设置子客户端
const setChildrenClient = (originId: string, ws: WebSocket) => {
  childrenClient.set(originId, ws);
  // 得到子客户端的消息。只会是actions请求。
  ws.on('message', (message: string) => {
    if (global.sandbox) {
      if (global.testoneClient && global.testoneClient.readyState === WebSocket.OPEN) {
        // 发给 web 的数据，需要是字符串
        global.testoneClient.send(message.toString());
      }

      return;
    }

    if (platformClient.size > 0) {
      platformClient.forEach((platformWs, platformId) => {
        // 检查平台客户端状态
        if (platformWs.readyState === WebSocket.OPEN) {
          platformWs.send(message);
        } else {
          // 如果连接已关闭，删除该平台客户端
          platformClient.delete(platformId);
        }
      });
    }
  });
  // 处理关闭事件
  ws.on('close', () => {
    childrenClient.delete(originId);
    logger.debug({
      code: ResultCode.Fail,
      message: `Client ${originId} disconnected`,
      data: null
    });
  });
  ws.on('error', err => {
    logger.error({
      code: ResultCode.Fail,
      message: `Client ${originId} error`,
      data: err
    });
  });
};

// 全量客户端
const setFullClient = (originId: string, ws: WebSocket) => {
  fullClient.set(originId, ws);
  // 处理消息事件
  ws.on('message', (message: string) => {
    if (global.sandbox) {
      if (global.testoneClient && global.testoneClient.readyState === WebSocket.OPEN) {
        // 发给 web 的数据，需要是字符串
        global.testoneClient.send(message.toString());
      }

      return;
    }

    if (platformClient.size > 0) {
      platformClient.forEach((platformWs, platformId) => {
        // 检查平台客户端状态
        if (platformWs.readyState === WebSocket.OPEN) {
          platformWs.send(message);
        } else {
          // 如果连接已关闭，删除该平台客户端
          platformClient.delete(platformId);
        }
      });
    }
  });
  // 处理关闭事件
  ws.on('close', () => {
    fullClient.delete(originId);
    logger.debug({
      code: ResultCode.Fail,
      message: `Client ${originId} disconnected`,
      data: null
    });
  });
};

/**
 * @param originId
 * @param ws
 */
const setPlatformClient = (originId: string, ws: WebSocket) => {
  // 仅允许有一个平台连接
  if (platformClient.size > 0) {
    logger.error({
      code: ResultCode.Fail,
      message: `平台连接已存在: ${originId}`,
      data: null
    });
    ws.close(); // 关闭新连接

    return;
  }
  // 设置平台客户端
  platformClient.set(originId, ws);

  // 得到平台客户端的消息
  ws.on('message', (message: string) => {
    try {
      // 解析消息
      const parsedMessage: ParsedMessage = JSON.parse(message.toString());

      // 1. 解析得到 actionId ，说明是消费行为请求。要广播告诉所有客户端。
      // 2. 解析得到 name ，说明是一个事件请求。
      // 3. 解析得到 apiId ，说明是一个接口请求。
      logger.debug({
        code: ResultCode.Ok,
        message: '服务端接收到消息',
        data: parsedMessage
      });
      if (parsedMessage.apiId) {
        // 指定的设备 处理消费。终端有记录每个客户端是谁
        const DeviceId = parsedMessage.DeviceId;

        handleApi(DeviceId, message);
      } else if (parsedMessage?.actionId) {
        // 指定的设备 处理消费。终端有记录每个客户端是谁
        const DeviceId = parsedMessage.DeviceId;

        handleAction(DeviceId, message);
      } else if (parsedMessage?.name) {
        const ID = parsedMessage.ChannelId || parsedMessage.GuildId || parsedMessage.DeviceId;

        handleEvent(message, ID);
      }
    } catch (error) {
      logger.error({
        code: ResultCode.Fail,
        message: '服务端解析平台消息失败',
        data: error
      });
    }
  });

  // 处理关闭事件
  ws.on('close', () => {
    platformClient.delete(originId);
    logger.debug({
      code: ResultCode.Fail,
      message: `Client ${originId} disconnected`,
      data: null
    });
  });

  ws.on('error', err => {
    logger.error({
      code: ResultCode.Fail,
      message: `Client ${originId} error`,
      data: err
    });
  });
};

/**
 * @param originId
 * @param ws
 */
const setTestOnePlatformClient = (ws: WebSocket) => {
  if (global.testoneClient) {
    delete global.testoneClient;
  }

  global.testoneClient = ws;

  const controller = createTestOneController(ws, null);

  // 得到平台客户端的消息
  ws.on('message', (message: string) => {
    try {
      // 解析消息
      const parsedMessage: ParsedMessage = flattedJSON.parse(message.toString());

      // 1. 解析得到 actionId ，说明是消费行为请求。要广播告诉所有客户端。
      // 2. 解析得到 name ，说明是一个事件请求。
      // 3. 解析得到 apiId ，说明是一个接口请求。
      logger.debug({
        code: ResultCode.Ok,
        message: '测试端接收到消息',
        data: parsedMessage
      });
      if (parsedMessage.apiId) {
        // 指定的设备 处理消费。终端有记录每个客户端是谁
        const DeviceId = parsedMessage.DeviceId;

        handleApi(DeviceId, message);
      } else if (parsedMessage?.actionId) {
        // 指定的设备 处理消费。终端有记录每个客户端是谁
        const DeviceId = parsedMessage.DeviceId;

        handleAction(DeviceId, message);
      } else if (parsedMessage?.name) {
        const ID = parsedMessage.ChannelId || parsedMessage.GuildId || parsedMessage.DeviceId;

        handleEvent(message, ID);
      } else {
        controller.onMessage(parsedMessage);
      }
    } catch (error) {
      logger.error({
        code: ResultCode.Fail,
        message: '测试端解析平台消息失败',
        data: error
      });
    }
  });

  // 处理关闭事件
  ws.on('close', () => {
    controller.close();
  });

  ws.on('error', err => {
    controller.error(err);
  });
};

/**
 * CBP 服务器
 * @param port
 * @param listeningListener
 */
export const cbpServer = (port: number, listeningListener?: () => void) => {
  if (global.chatbotServer) {
    delete global.chatbotServer;
  }

  // 重连计数
  let count = 0;

  /**
   * 获取重连时间
   * @returns
   */
  const getReConnectTime = () => {
    count++; // 增加重连计数
    const time = count > 3 ? 1000 * 6 : 1000 * 1;
    let curTime = count > 6 ? 1000 * count * 2 : time;

    // 最大不超过 10 分钟。
    if (curTime >= 1000 * 60 * 10) {
      curTime = 1000 * 60 * 10;
    }
    const mTime = (curTime / 1000 / 60).toFixed(2);

    logger.info(`[alemonjs][CBP Server] 第 ${count} 次重连，等待 ${mTime} 分钟后重新连接`);

    return curTime;
  };

  /**
   * 创建服务器
   * @returns
   */
  const createServer = () => {
    try {
      // create
      const app = new Koa();

      // MessageRouter
      app.use(MessageRouter.routes());
      app.use(MessageRouter.allowedMethods());
      // Cors
      app.use(
        koaCors({
          origin: '*', // 允许所有来源
          allowMethods: ['GET', 'POST', 'PUT', 'DELETE'] // 允许的 HTTP 方法
        })
      );
      const server = app.listen(port, listeningListener);

      // 创建 WebSocketServer 并监听同一个端口
      global.chatbotServer = new WebSocketServer({ server });

      // 处理客户端连接
      global.chatbotServer.on('connection', (ws, request) => {
        // 测试平台的连接
        if (request.url === '/testone') {
          if (!global.sandbox) {
            ws.close(4000, 'Sandbox mode required');

            return;
          }
          setTestOnePlatformClient(ws);

          return;
        }

        // 读取请求头中的 来源
        const headers = request.headers;
        const origin = headers[USER_AGENT_HEADER] || USER_AGENT_HEADER_VALUE_MAP.client;
        // 来源id
        const originId = headers[DEVICE_ID_HEADER] as string;

        if (!originId) {
          // 如果没有来源 ID，拒绝连接
          ws.close(4000, 'Missing Device ID');

          return;
        }
        logger.debug({
          code: ResultCode.Ok,
          message: `Client ${originId} connected`,
          data: null
        });
        // 根据来源进行分类
        if (origin === USER_AGENT_HEADER_VALUE_MAP.platform) {
          setPlatformClient(originId, ws);

          return;
        } else if (origin === USER_AGENT_HEADER_VALUE_MAP.client) {
          // 连接时，需要给客户端发送主动消息
          ws.send(
            JSON.stringify({
              active: 'sync',
              payload: {
                value: getConfig().value,
                args: getConfig().argv,
                package: {
                  version: getConfig().package?.version
                },
                env: {
                  login: process.env.login,
                  platform: process.env.platform,
                  port: process.env.port
                }
              },
              // 主动消息
              activeId: originId
            })
          );
        }
        const isFullReceive = headers[FULL_RECEIVE_HEADER] === '1';

        // 如果是全量接收
        if (isFullReceive) {
          setFullClient(originId, ws);

          return;
        }
        setChildrenClient(originId, ws);
      });

      chatbotServer.on('error', (err: { code: string; message: string; stack?: string }) => {
        // 清理所有客户端连接
        platformClient.clear();
        childrenClient.clear();
        fullClient.clear();
        delete global.testoneClient;

        // 发现是端口已经被占用
        if (err.code === 'EADDRINUSE') {
          logger.error({
            code: ResultCode.FailInternal,
            message: `端口 ${port} 已被占用，请检查是否有其他服务在运行`,
            data: err.message
          });

          const reCreateTime = getReConnectTime();

          // 清理所有客户端连接，开始重新创建服务器
          setTimeout(() => {
            createServer();
          }, reCreateTime);
        } else {
          logger.error({
            code: ResultCode.FailInternal,
            message: 'WebSocket server error',
            data: err.message || 'Unknown error'
          });
        }
      });

      chatbotServer.on('close', () => {
        logger.warn({
          code: ResultCode.Ok,
          message: 'WebSocket server closed',
          data: null
        });
        // 清理所有客户端连接
        platformClient.clear();
        childrenClient.clear();
        fullClient.clear();
      });
    } catch (error) {
      logger.error({
        code: ResultCode.FailInternal,
        message: '创建 CBP 服务器失败',
        data: error
      });
    }
  };

  createServer();
};
