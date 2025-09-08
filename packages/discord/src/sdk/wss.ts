import WebSocket from 'ws';
import { DCAPI } from './api.js';
import { getIntents } from './intents.js';
import { DCEventMap } from './message.js';
import { getDiscordConfig } from '../config.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { AvailableIntentsEventsEnum } from './types.js';
import dayjs from 'dayjs';

/**
 * @description Discord WebSocket 客户端
 */
export class DCClient extends DCAPI {
  #heartbeat_interval = 0;

  #session_id = '';

  #gateway_url = '';

  #timeout_id = null;

  #seq = null;

  #ws: WebSocket;

  // 重连次数
  #count = 0;

  #events: {
    [K in keyof DCEventMap]?: (event: DCEventMap[K]) => any;
  } = {};

  constructor() {
    super();

    return this;
  }

  /**
   * 连接确认
   * @returns
   */
  #aut() {
    const value = getDiscordConfig();
    const token = value.token;
    const intent = value.intent || AvailableIntentsEventsEnum;
    const shard = value.shard || [0, 1];

    return {
      op: 2,
      d: {
        shard: shard,
        // 验证token
        token: `Bot ${token}`,
        intents: getIntents(intent),
        properties: {
          os: process.platform,
          browser: 'alemonjs',
          device: 'alemonjs'
        }
      }
    };
  }

  #getReConnectTime() {
    const time = this.#count > 3 ? 1000 * 6 : 1000 * 1;
    const curTime = this.#count > 6 ? 1000 * this.#count * 2 : time;

    logger.info(`[ws-discord] 等待 ${dayjs(curTime).format('mm:ss')} 后重新连接`);

    return curTime;
  }

  /**
   * 注册事件处理程序
   * @param key 事件名称
   * @param val 事件处理函数
   */
  on<T extends keyof DCEventMap>(key: T, val: (event: DCEventMap[T]) => any) {
    this.#events[key] = val;

    return this;
  }

  /**
   * 创建ws监听
   * @param conversation
   * @param shard
   * @returns
   */
  async connect() {
    this.#count++;

    const value = getDiscordConfig();
    const gatewayURL = value.gatewayURL;

    // 清除序列号
    this.#seq = null;
    // 清除心跳
    clearTimeout(this.#timeout_id);

    /**
     * 获取网关地址
     * @returns
     */
    const gateway = async () => {
      if (gatewayURL) {
        return gatewayURL;
      }
      const currentGateway = await this.gateway()
        .then(res => res?.url)
        .catch(() => null);

      return currentGateway;
    };

    try {
      // 获取网关
      const url = gatewayURL ?? (await gateway());

      // 没有网关
      if (!url) {
        logger.error('[ws-discord] 获取网关失败～');
        const curTime = this.#getReConnectTime();

        setTimeout(() => {
          void this.connect();
          // 等待重连
        }, curTime);

        return;
      }

      /**
       * 心跳恢复
       */
      const call = () => {
        this.#ws.send(
          JSON.stringify({
            op: 1, //  op = 1
            d: this.#seq // 如果是第一次连接，传null
          })
        );
        // 确保清除
        clearTimeout(this.#timeout_id);
        // 开始心跳
        this.#timeout_id = setTimeout(call, this.#heartbeat_interval);
      };

      const map = {
        /**
         * 事件接收到
         * @param param0
         */
        0: ({ d, t, s }) => {
          if (s) {
            // 序列号
            this.#seq = s;
          }
          // 准备
          if (t === 'READY') {
            if (d?.resume_gateway_url) {
              this.#gateway_url = d?.resume_gateway_url;
              logger.info('[ws-discord] gateway_url', this.#gateway_url);
            }
            if (d?.session_id) {
              this.#session_id = d?.session_id;
              logger.info('[ws-discord] session_id', this.#session_id);
            }
          }
          // 事件处理
          if (this.#events[t]) {
            try {
              this.#events[t](d);
            } catch (err) {
              logger.error('[ws-discord] 事件处理错误', err);
            }
          }

          //
        },
        /**
         * 重新连接
         */
        7: () => {
          logger.info('[ws-discord] 重新连接');
        },
        /**
         * 无效会话
         * @param message
         */
        9: ({ d }) => {
          logger.error('[ws-discord] 无效会话', d);
        },
        /**
         * 你好
         * @param param0
         */
        10: ({ d }) => {
          // 得到心跳间隔
          this.#heartbeat_interval = d.heartbeat_interval;

          // 开始心跳
          call();

          // 开启会话
          this.#ws.send(JSON.stringify(this.#aut()));
        },
        /**
         * 心跳确认
         */
        11: () => {
          logger.info('[ws-discord] 心跳确认');
        }
      };

      const ClientOptions = value.websocket_options || {};

      if (value.websocket_proxy) {
        ClientOptions.agent = new HttpsProxyAgent(value.websocket_proxy);
      }

      this.#ws = new WebSocket(`${url}?v=10&encoding=json`, ClientOptions);

      this.#ws.on('open', () => {
        logger.info('[ws-discord] 打开连接');
        // 连接成功
        this.#count = 0;
      });

      // 消息
      this.#ws.on('message', data => {
        const message = JSON.parse(data.toString());

        if (map[message.op]) {
          map[message.op](message);
        }
      });

      // 关闭
      this.#ws.on('close', err => {
        logger.info('[ws-discord] 连接关闭', err);
        const curTime = this.#getReConnectTime();

        setTimeout(() => {
          void this.connect();
        }, curTime);
      });

      // 出错
      this.#ws.on('error', err => {
        logger.error('[ws-discord] 出错', err?.message || err);
      });
    } catch (err) {
      // 内部错误
      logger.error('[ws-discord] 内部错误', err);
    }
  }
}
